import { world, system, DisplaySlotId } from "@minecraft/server";
import {
    http,
    HttpRequest,
    HttpRequestMethod,
    HttpHeader,
    websocket
} from "@minecraft/server-net";

console.warn("EtherVilles Loaded!");

// ======================================================
// CONFIG
// ======================================================

const WS_URL = "ws://127.0.0.1:19131/ws/chat";
const RECONNECT_DELAY = 100;
const START_DELAY = 40;
const PLAYER_UPDATE_INTERVAL = 100;

// ======================================================
// LOGGER
// ======================================================

function log(message) {
    console.warn(`[DiscordBridge] ${message}`);
}

// ======================================================
// TPS STATE
// ======================================================

let lastRun = Date.now();
let currentTps = 20;
let tpsHistory = [];
let tpsObjective = null;

// ======================================================
// SCOREBOARD
// ======================================================

function setupScoreboard() {
    try {
        const existingObjective = world.scoreboard.getObjective("ethervilles_status");

        if (existingObjective) {
            tpsObjective = existingObjective;
        } else {
            tpsObjective = world.scoreboard.addObjective("ethervilles_status", "§l§6 EtherVilles §r");
        }

        world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, {
            objective: tpsObjective,
            displayName: "§l§6 EtherVilles Network §r"
        });

        updateScoreboardDisplay();

    } catch (err) {
        console.error(`[SCOREBOARD ERROR] ${err}`);
    }
}

function updateScoreboardDisplay() {
    try {
        if (!tpsObjective) {
            setupScoreboard();
            return;
        }

        const players = world.getPlayers();
        const onlineCount = players.length;

        const currentTime = new Date();
        const hours = String(currentTime.getHours()).padStart(2, '0');
        const minutes = String(currentTime.getMinutes()).padStart(2, '0');
        const timeString = `${hours}:${minutes}`;

        const participants = tpsObjective.getParticipants();
        for (const participant of participants) {
            tpsObjective.removeParticipant(participant);
        }

        let tpsColor = "§c";
        if (currentTps >= 19) tpsColor = "§a";
        else if (currentTps > 15) tpsColor = "§e";

        tpsObjective.setScore(`§a| §rTPS: ${tpsColor}${currentTps.toFixed(1)}§7/20`, 3);
        tpsObjective.setScore(`§a| §rONN: §a${onlineCount}§7/20`, 2);
        tpsObjective.setScore(`§a| §rJAM: §b${timeString}`, 1);

    } catch (err) {
        console.error(`[UPDATE ERROR] ${err}`);
    }
}

function getStatusTitle(tps) {
    if (tps >= 18) return "§l§a EtherVilles - Perfect §r";
    if (tps >= 15) return "§l§e EtherVilles - Stable §r";
    if (tps >= 10) return "§l§6 EtherVilles - Lagging §r";
    return "§l§c EtherVilles - Critical §r";
}

// ======================================================
// WEBSOCKET
// ======================================================

let ws;

async function connect() {
    try {
        ws = await websocket.connect(WS_URL);

        log("Connected");

        registerWebSocketEvents();

    } catch (error) {
        log(`Connect Error: ${error}`);

        reconnect();
    }
}

function registerWebSocketEvents() {
    ws.afterEvents.message.subscribe(handleIncomingMessage);
    ws.afterEvents.close.subscribe(() => {
        log("Disconnected");

        reconnect();
    });
}

function handleIncomingMessage(event) {
    try {
        const data = JSON.parse(event.message);

        if (data.type !== "chat") return;

        world.sendMessage(
            `§9[DC] §b${data.player}§f » ${data.message}`
        );

    } catch (error) {
        log(`Message Error: ${error}`);
    }
}

function reconnect() {
    system.runTimeout(() => {
        connect();
    }, RECONNECT_DELAY);
}

// ======================================================
// MINECRAFT -> DISCORD (chat)
// ======================================================

world.afterEvents.chatSend.subscribe((event) => {
    if (!ws?.isOpen) return;

    const message = event.message?.trim();
    if (!message) return;

    ws.send(JSON.stringify({
        type: "chat",
        player: event.sender.name,
        message
    }));
});

// ======================================================
// INTERVALS
// ======================================================

// Scoreboard display update (every 1 second)
system.runInterval(() => {
    updateScoreboardDisplay();
}, 20);

// TPS tracker + HTTP + online player update (every 10 seconds)
system.runInterval(async () => {
    try {
        const now = Date.now();
        const delta = now - lastRun;
        lastRun = now;

        const players = world.getPlayers();
        const playerList = [];

        for (const player of players) {
            playerList.push({
                name: player.name,
                x: Math.floor(player.location.x),
                y: Math.floor(player.location.y),
                z: Math.floor(player.location.z),
                dimension: player.dimension.id
            });
        }

        // TPS estimation
        const expectedMs = 10000;
        const tps = +(20 * expectedMs / delta).toFixed(2);
        currentTps = Math.max(0, Math.min(20, tps));

        tpsHistory.push(currentTps);
        if (tpsHistory.length > 10) tpsHistory.shift();

        // Update scoreboard title
        if (tpsObjective) {
            try {
                world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, {
                    objective: tpsObjective,
                    displayName: getStatusTitle(currentTps)
                });
            } catch (e) { /* Ignore */ }
        }

        // Send to HTTP API
        const payload = {
            server: "EtherVilles",
            timestamp: Date.now(),
            tps: currentTps,
            online: players.length,
            players: playerList
        };

        const request = new HttpRequest("http://127.0.0.1:19131/api/tracker");
        request.method = HttpRequestMethod.Post;
        request.headers = [new HttpHeader("Content-Type", "application/json")];
        request.body = JSON.stringify(payload);
        request.timeout = 30;

        await http.request(request);

    } catch (err) {
        console.error(`[ETHERVILLES ERROR] ${err}`);
    }
}, 200);

// Send online player list to Discord bot (every 5 seconds)
system.runInterval(() => {
    if (!ws?.isOpen) return;

    const players = world.getPlayers().map(player => player.name);

    ws.send(JSON.stringify({
        type: "online",
        players
    }));
}, PLAYER_UPDATE_INTERVAL);

// ======================================================
// START
// ======================================================

system.run(() => {
    setupScoreboard();
    updateScoreboardDisplay();
});


system.runTimeout(() => {
    connect();
}, START_DELAY);

console.warn("§a EtherVilles START §r");