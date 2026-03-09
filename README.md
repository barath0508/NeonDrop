<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/zap.svg" width="120" alt="NeonDrop Logo">
  <h1>NeonDrop</h1>
  <p><strong>Insanely Fast, Zero-Server P2P File Transfer. Built with WebRTC & React.</strong></p>
</div>

---

NeonDrop is a modern file-sharing web application designed to transfer files of **unlimited sizes** straight from your browser to anyone in the world at the **physical limit of your connection**.

Unlike traditional cloud storage (Google Drive, Dropbox), NeonDrop **does not upload your files to a slow intermediary server**. Instead, it uses WebRTC to punch a direct hole between the sender and receiver, establishing a mathematically-secure TLS tunnel. 

The result? If you're sending a 10GB 4K video to a laptop on the same Wi-Fi, it instantly streams over your local router at Gigabit speeds, completely sidestepping your ISP limits.

---

## ⚡ Key Features

*   **Zero Server Routing:** Your files never touch our servers. We only facilitate the initial handshake.
*   **Maximum Speed:** Transfers occur directly between devices. Same Wi-Fi? Gigabit speeds. Different countries? Maximum bandwidth available between ISPs.
*   **End-to-End Encryption:** Because the connection is peer-to-peer over DTLS, your data is cryptographically sealed in transit. Not even we can see what you're sending.
*   **No Size Limits:** Since we don’t pay for cloud storage to temporarily hold your files, there are no artificial limits.
*   **Cross-Device Compatibility:** Desktop, tablet, or mobile. Works identically on Google Chrome, Firefox, Safari, and Edge.
*   **QR Code Linking:** Seamlessly jump from desktop to mobile by scanning the automatically generated Room QR code.
*   **Neon Cyberpunk Aesthetic:** A high-end, deeply interactive UI featuring massive 3D floating background orbs, fluid glassmorphism, fluid typography, and dynamic spring-physics animations powered by Framer Motion.

---

## 🛠️ The Tech Stack

NeonDrop entirely splits the concern between signaling/matchmaking (Backend) and actual file streaming (Frontend).

### Frontend (Client)
*   **Vite + React.js**: Lightning-fast unbundled development and optimized production builds.
*   **Framer Motion**: State-of-the-art animation library providing the continuous physics/spring interactions and the 3D animated `BackgroundOrbs` system.
*   **Vanilla CSS Variables**: Employs a complex design system featuring deep violets, hot pinks, neon cyans, and complex glassmorphic blurs (`backdrop-filter`) for the ultimate Cyberpunk aesthetic.
*   **WebRTC API (`RTCPeerConnection` & `RTCDataChannel`)**: The engine. Handles the STUN/TURN negotiation and establishes the ultra-high bandwidth, ordered UDP streaming channel.
*   **Socket.io-client**: Used exclusively to relay tiny SDP (`offer`/`answer`) and ICE candidates to establish the WebRTC connection.

### Backend (Signaling Server)
*   **Node.js & Express**: Provides a tiny, memory-efficient HTTP server.
*   **Socket.io**: Real-time websocket server. Tracks active 6-character "Rooms", pairs two users up, and acts as the secure middleman to negotiate their local network states before bowing out completely.

---

## 🚀 Getting Started Locally

NeonDrop consists of two separate apps (client and server) managed by a root-level Concurrently script.

### Prerequisites
*   Node.js (v18+ recommended)
*   npm or yarn

### Installation

1.  **Clone the repository** (or download the source):
    ```bash
    git clone https://github.com/yourusername/neondrop.git
    cd neondrop
    ```

2.  **Install dependencies**:
    Because it's a monorepo, you need to install packages in the root, client, and server directories.
    ```bash
    npm install
    cd client && npm install
    cd ../server && npm install
    cd ..
    ```

3.  **Start the Development Servers**:
    The root `package.json` contains a script that uses `concurrently` to spin up both Vite (React) and Node.js simultaneously.
    ```bash
    npm start
    ```
    *   **Client** will run on `http://localhost:5173`
    *   **Server** will run on `http://localhost:3001`
    
    *Note: The React app is already configured to automatically detect and connect to the local signaling server on port 3001.*

---

## 🏗️ Project Structure

```text
p2p-file-transfer/
├── client/                     # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── BackgroundOrbs.jsx  # Complex Framer Motion 3D background
│   │   │   ├── FileTransfer.jsx    # The core Send/Receive Dropzone UI
│   │   │   ├── Home.jsx            # The Marketing Landing Page
│   │   │   ├── RoomCreator.jsx     # Sender QR Code generator
│   │   │   └── RoomJoiner.jsx      # Receiver QR Scanner & Input
│   │   ├── hooks/
│   │   │   └── useWebRTC.js        # THE ENGINE: Handles all RTCPeerConnection logic
│   │   ├── App.jsx                 # Router mapping and Layout
│   │   ├── global.css              # Cyberpunk Design System
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/                     # Minimal Signaling Server
│   ├── index.js                # Socket.io Room orchestration logic
│   └── package.json
└── package.json                # Root concurrently runner
```

## 🔒 A Note on WebRTC Connectivity

WebRTC attempts to connect browsers directly (P2P). However, many enterprise networks, strict firewalls, or cellular carriers employ Symetric NATs that block incoming UDP streams. 

To ensure NeonDrop **always** works for every user regardless of their network layout, `useWebRTC.js` is bundled with public **STUN** servers (to discover public IP addresses) and fallback **TURN** servers (which act as a secure relay *only* when direct P2P is blocked).

The integration inside `useWebRTC.js` ensures that transfer reliability is identical to centralized architectures, while inherently maintaining the speed benefits for 90% of users. 

---

<p align="center">Made with ❤️</p>
