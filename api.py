import json
import asyncio
import os
import time

import discord
from discord import app_commands

from fastapi import FastAPI, WebSocket
from fastapi.responses import JSONResponse
import uvicorn

# ==================================================
# CONFIG
# ==================================================

TOKEN = "DISCORD_BOT_TOKEN_"
CHANNEL_ID = 123456789012345678  # ganti dengan ID channel discord

DATA_FILE = "data.json"

# ==================================================
# APP & STATE
# ==================================================

app = FastAPI()

mc_clients: list[WebSocket] = []
online_players: list[str] = []

# ==================================================
# DATA HELPERS
# ==================================================

def load_data() -> dict:
    if not os.path.exists(DATA_FILE):
        return {
            "timestamp": 0,
            "tps": 0,
            "online": 0,
            "players": []
        }
    with open(DATA_FILE, "r") as f:
        return json.load(f)


def save_data(data: dict) -> None:
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)

# ==================================================
# DISCORD
# ==================================================

intents = discord.Intents.default()
intents.message_content = True

bot = discord.Client(intents=intents)
tree = app_commands.CommandTree(bot)

# ==================================================
# READY
# ==================================================

@bot.event
async def on_ready():
    await tree.sync()
    print(f"✅ Discord bot logged in as {bot.user}")

# ==================================================
# SLASH COMMAND
# ==================================================

@tree.command(
    name="online",
    description="Lihat player Minecraft online"
)
async def online(interaction: discord.Interaction):
    if len(online_players) == 0:
        await interaction.response.send_message(
            "❌ Tidak ada player online. loginlah kauu"
        )
        return

    text = "\n".join([f"• {p}" for p in online_players])
    await interaction.response.send_message(
        f"🟢 Online ({len(online_players)}):\n{text}"
    )

# ==================================================
# DISCORD -> MC
# ==================================================

@bot.event
async def on_message(message: discord.Message):
    if message.author.bot:
        return

    if message.channel.id != CHANNEL_ID:
        return

    if not message.content.strip():
        return

    payload = json.dumps({
        "type": "chat",
        "player": message.author.name,
        "message": message.content
    })

    print("[DISCORD -> MC]", payload)

    dead_clients: list[WebSocket] = []

    for client in mc_clients:
        try:
            await client.send_text(payload)
        except Exception:
            dead_clients.append(client)

    for dc in dead_clients:
        if dc in mc_clients:
            mc_clients.remove(dc)

# ==================================================
# WEBSOCKET  (MC <-> Discord bridge)
# ==================================================

@app.websocket("/ws/chat")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    mc_clients.append(ws)
    print("🟢 Minecraft connected")

    try:
        while True:
            data = await ws.receive_text()
            payload: dict = json.loads(data)

            # ── Online player list update ──────────────────────
            if payload["type"] == "online":
                online_players.clear()
                online_players.extend(payload["players"])

                await bot.change_presence(
                    activity=discord.Game(
                        name=f"{len(online_players)} player online"
                    )
                )
                continue

            # ── Chat forwarding MC -> Discord ──────────────────
            if payload["type"] == "chat":
                print("[MC -> DISCORD]", payload)

                player = payload["player"]
                msg = payload["message"]

                channel = bot.get_channel(CHANNEL_ID)
                if channel:
                    await channel.send(
                        f"`[MC]` **{player}** » {msg}"
                    )

    except Exception as e:
        print("❌", e)

    finally:
        if ws in mc_clients:
            mc_clients.remove(ws)
        print("🔴 Minecraft disconnected")

# ==================================================
# REST API  (tracker)
# ==================================================

@app.post("/api/tracker")
async def tracker(request_data: dict):
    try:
        request_data["server_received"] = int(time.time())
        save_data(request_data)
        return JSONResponse({
            "success": True,
            "message": "Data saved"
        })
    except Exception as e:
        return JSONResponse(
            {"success": False, "error": str(e)},
            status_code=500
        )


@app.get("/api/latest")
async def latest():
    data = load_data()
    return JSONResponse({
        "tps": data.get("tps", 0),
        "online": data.get("online", 0),
        "players": data.get("players", [])
    })


@app.get("/")
async def home():
    return JSONResponse({
        "status": "online",
        "api": "/api/latest"
    })

# ==================================================
# MAIN
# ==================================================

async def main():
    config = uvicorn.Config(
        app,
        host="0.0.0.0",
        port=19131,
        log_level="warning"
    )
    server = uvicorn.Server(config)

    await asyncio.gather(
        server.serve(),
        bot.start(TOKEN)
    )


asyncio.run(main())