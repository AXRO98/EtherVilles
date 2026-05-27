# EtherVilles Network — Discord ↔ Minecraft Bridge

Ini cuman project gabut buat server Minecraft saya jadi kalau masih banyak kekurangan mohon maaf karena saya juga masih belajar bikin server Minecraft dan belajar Script API Bedrock.

Sistem ini dibuat menggunakan:

- Minecraft Script API Addon
- Python FastAPI WebSocket Server
- Discord Bot (`discord.py`)
- HTTP API Tracker
- Minecraft Scoreboard System

Server Minecraft saya menggunakan:

- Minecraft Bedrock Dedicated Server (BDS)
- Vanilla Minecraft Bedrock
- VPS Ubuntu Server 24.04 LTS

---

# Fungsi Sistem

Sistem ini digunakan untuk:

✅ Chat Minecraft masuk ke Discord  
✅ Chat Discord masuk ke Minecraft  
✅ Update player online realtime  
✅ Discord bot presence status  
✅ Slash command `/online`  
✅ Monitoring TPS server  
✅ Monitoring player online  
✅ Monitoring lokasi player  
✅ Update status server ke website  
✅ Dynamic scoreboard Minecraft  
✅ Realtime API tracker

---

# Website Monitoring

Data server EtherVilles dikirim secara realtime ke:

https://ethervilles.kipen.my.id

Website tersebut digunakan untuk:

- Monitoring TPS server
- Monitoring player online
- Monitoring daftar player
- Monitoring status server realtime

Data dikirim dari Minecraft Addon → Python API → Website.

---

# Environment

Project ini dibuat dan dijalankan menggunakan:

## Minecraft Server

- Minecraft Bedrock Dedicated Server (BDS)
- Vanilla Bedrock Server
- Version `1.21.61.1`

## Operating System

- Ubuntu Server 24.04 LTS
- VPS Linux Server

## Minecraft API

Menggunakan Experimental Script API:

- `@minecraft/server`
- `@minecraft/server-net`

## Requirement

Pastikan Experimental Features aktif:

- Beta APIs
- Script API
- Upcoming Creator Features

---

# Cara Kerja Sistem

Sistem bekerja menggunakan kombinasi:

- WebSocket
- HTTP API
- Discord Bot
- Minecraft Script API

---

# Arsitektur Sistem

```text
Minecraft Bedrock Server
(Addon Script API)
        │
        ├── WebSocket (chat bridge)
        │
        ├── HTTP API (tracker)
        ▼
Python FastAPI Server
        │
        ├── Discord Bot
        │
        ├── REST API
        │
        └── JSON Tracker
        ▼
Discord + Website Monitoring
```

---

# Alur Chat Minecraft → Discord

1. Player mengirim chat di Minecraft
2. Addon menangkap event chat
3. Data dikirim ke FastAPI menggunakan WebSocket
4. Python menerima payload
5. Bot Discord meneruskan chat ke channel Discord

## Contoh

### Minecraft

```text
Steve: halo semua
```

### Discord

```text
[MC] Steve » halo semua
```

---

# Alur Chat Discord → Minecraft

1. User mengirim pesan di Discord
2. Discord bot membaca pesan
3. Python mengirim payload ke Minecraft melalui WebSocket
4. Addon menerima pesan
5. Pesan muncul di chat Minecraft

## Contoh

### Discord

```text
Admin: server restart 5 menit lagi
```

### Minecraft

```text
[DC] Admin » server restart 5 menit lagi
```

---

# Sistem Tracker Website

Addon Minecraft secara otomatis mengirim data server setiap beberapa detik ke API tracker.

## Data yang dikirim

```json
{
  "server": "EtherVilles",
  "timestamp": 123456789,
  "tps": 19.98,
  "online": 5,
  "players": [
    {
      "name": "Steve",
      "x": 120,
      "y": 70,
      "z": -45,
      "dimension": "minecraft:overworld"
    }
  ]
}
```

---

# REST API

## POST `/api/tracker`

Digunakan Minecraft Addon untuk mengirim data server.

---

## GET `/api/latest`

Mengambil data server terbaru.

### Response

```json
{
  "online": 1,
  "players": [
    {
      "dimension": "minecraft:overworld",
      "name": "Player1",
      "x": 0,
      "y": 0,
      "z": 0
    }
  ],
  "tps": 20
}
```

---

# Scoreboard System

Addon juga memiliki dynamic scoreboard realtime di dalam Minecraft.

## Informasi yang ditampilkan

- TPS Server
- Jumlah player online
- Jam server realtime
- Status server

---

# Status TPS

Scoreboard memiliki status otomatis berdasarkan TPS server.

| TPS | Status |
|---|---|
| 18 - 20 | Perfect |
| 15 - 17 | Stable |
| 10 - 14 | Lagging |
| < 10 | Critical |

---

# Contoh Scoreboard

```text
EtherVilles Network

TPS: 19.9/20
ONN: 5/20
JAM: 19:45
```

---

# Discord Features

Bot Discord memiliki fitur:

- Chat bridge
- Presence player online
- Slash command `/online`

## Contoh

```text
/online
```

### Response

```text
🟢 Online (3):
• Steve
• Alex
• Herobrine
```

---

# Teknologi Yang Digunakan

## Minecraft

- `@minecraft/server`
- `@minecraft/server-net`

## Python

- FastAPI
- Uvicorn
- Discord.py
- AsyncIO

## Communication

- WebSocket
- HTTP REST API
- JSON Payload

---

# Struktur Sistem

```text
project/
│
├── addon/
│   └── scripts/
│       └── main.js
│
├── api/
│   └── main.py
│
├── data.json
│
└── README.md
```

---

# Tujuan Project

Project ini dibuat untuk:

- Belajar Script API Minecraft Bedrock
- Belajar WebSocket realtime
- Monitoring Minecraft server
- Integrasi Discord ↔ Minecraft
- Belajar backend Python FastAPI
- Eksperimen addon Bedrock
- Dasar pengembangan sistem multiplayer yang lebih besar

---

# Prototype Notice

Project ini hanyalah prototype / proof of concept.

Masih banyak kekurangan, kode juga belum sempurna, dan sistem ini masih bisa dikembangkan jauh lebih bagus lagi.