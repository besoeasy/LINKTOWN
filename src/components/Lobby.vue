<script setup lang="ts">
import { ref } from 'vue'
import { CORE_DETAILS, CORE_IDS, type CoreId } from '../game/config'
import type { PublicRoom } from '../net/directory'

const props = defineProps<{
  callsign: string
  selectedCore: CoreId
  rooms: PublicRoom[]
  dirOnline: boolean
  inviteRoomCode?: string
  isConnecting?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:callsign', val: string): void
  (e: 'update:selectedCore', val: CoreId): void
  (e: 'startSolo'): void
  (e: 'createPeerRoom'): void
  (e: 'joinPeerRoom', code: string): void
  (e: 'refreshRooms'): void
}>()

const activeTab = ref<'cores' | 'rooms' | 'controls'>('cores')
const roomCodeInput = ref('')

const handleJoinInput = () => {
  const code = roomCodeInput.value.trim().toUpperCase()
  if (code) {
    emit('joinPeerRoom', code)
  }
}
</script>

<template>
  <div class="lobby">
    <div class="lobby-inner">
      <header class="lobby-header">
        <div class="brand">
          <h1>L-TOWN</h1>
          <span class="sub">3049 REMOTE AGE // ATMA CORES</span>
        </div>
        <div class="pilot">
          <label for="callsign">OPERATOR CALLSIGN</label>
          <input
            id="callsign"
            type="text"
            maxlength="18"
            placeholder="Enter callsign"
            :value="callsign"
            @input="emit('update:callsign', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </header>

      <div v-if="inviteRoomCode" class="invite">
        <span>Room invite: <strong>{{ inviteRoomCode }}</strong></span>
        <button :disabled="isConnecting" @click="emit('joinPeerRoom', inviteRoomCode)">
          {{ isConnecting ? 'Connecting…' : 'Connect & play' }}
        </button>
      </div>

      <nav class="tabs">
        <button :class="{ active: activeTab === 'cores' }" @click="activeTab = 'cores'">
          Cores
        </button>
        <button :class="{ active: activeTab === 'rooms' }" @click="activeTab = 'rooms'">
          Rooms ({{ rooms.length }})
        </button>
        <button :class="{ active: activeTab === 'controls' }" @click="activeTab = 'controls'">
          Controls
        </button>
      </nav>

      <main class="content">
        <div v-if="activeTab === 'cores'" class="cores-grid">
          <button
            v-for="cid in CORE_IDS"
            :key="cid"
            class="core-card"
            :class="{ selected: selectedCore === cid }"
            @click="emit('update:selectedCore', cid)"
          >
            <span class="core-top">
              <span class="core-badge">{{ CORE_DETAILS[cid].badge }}</span>
              <span class="core-name">{{ CORE_DETAILS[cid].name }}</span>
              <span class="core-cd">
                {{ CORE_DETAILS[cid].cooldown > 0 ? `${CORE_DETAILS[cid].cooldown / 1000}s` : 'Passive' }}
              </span>
            </span>
            <span class="core-maker">{{ CORE_DETAILS[cid].maker }} — {{ CORE_DETAILS[cid].ability }}</span>
            <span class="core-desc">{{ CORE_DETAILS[cid].desc }}</span>
          </button>
        </div>

        <div v-else-if="activeTab === 'rooms'" class="rooms">
          <div class="rooms-head">
            <span>{{ dirOnline ? 'Public games right now' : 'Directory offline — join by code below' }}</span>
            <button class="ghost" @click="emit('refreshRooms')">Refresh</button>
          </div>

          <p v-if="rooms.length === 0" class="empty">
            No public games. Host one and it appears here.
          </p>

          <div v-else class="room-list">
            <div v-for="r in rooms" :key="r.code" class="room-row">
              <span class="room-name">{{ r.name }}</span>
              <span class="room-meta">{{ r.code }} · {{ r.players }} / {{ r.maxPlayers }}</span>
              <button
                class="ghost"
                :disabled="isConnecting"
                @click="emit('joinPeerRoom', r.code)"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        <div v-else class="controls">
          <section>
            <h2>Controls</h2>
            <ul>
              <li><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move</li>
              <li><kbd>Mouse</kbd> Aim</li>
              <li><kbd>Click</kbd> Fire (−2 hull)</li>
              <li><kbd>Q</kbd> Core ability</li>
              <li><kbd>E</kbd> Super (−50 hull)</li>
              <li><kbd>R</kbd> Shield (−80 hull)</li>
              <li><kbd>Space</kbd> Jump (hold <kbd>Shift</kbd> for super jump)</li>
              <li><kbd>C</kbd> Crouch</li>
              <li><kbd>Tab</kbd> / <kbd>F</kbd> Scoreboard</li>
            </ul>
          </section>
          <section>
            <h2>Rules</h2>
            <p>
              Hull is ammunition: shots, jumps, shields and abilities spend it.
              Survive 7 seconds of calm to reconstruct to full hull.
            </p>
            <p>
              All chassis are identical. Only the Atma Core differs.
              {{ CORE_DETAILS[selectedCore].name }} — {{ CORE_DETAILS[selectedCore].desc }}
            </p>
          </section>
        </div>
      </main>

      <footer class="actions">
        <button class="primary" @click="emit('startSolo')">Solo trial</button>
        <button class="primary" :disabled="isConnecting" @click="emit('createPeerRoom')">Host match</button>
        <span class="join">
          <input
            v-model="roomCodeInput"
            type="text"
            placeholder="Room code"
            maxlength="8"
            @keyup.enter="handleJoinInput"
          />
          <button
            class="ghost"
            :disabled="!roomCodeInput.trim() || isConnecting"
            @click="handleJoinInput"
          >
            {{ isConnecting ? 'Joining…' : 'Join' }}
          </button>
        </span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.lobby {
  position: absolute;
  inset: 0;
  background: #0b0d12;
  color: #e6e8ee;
  font-family: 'Rajdhani', sans-serif;
  z-index: 20;
  overflow-y: auto;
}

.lobby-inner {
  min-height: 100%;
  max-width: 1060px;
  margin: 0 auto;
  padding: 32px 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.lobby-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  flex-wrap: wrap;
  padding-bottom: 16px;
  border-bottom: 1px solid #222835;
}

.brand h1 {
  margin: 0;
  font-size: 30px;
  letter-spacing: 4px;
  font-weight: 700;
  color: #f2f4f8;
}

.sub {
  font-size: 12px;
  letter-spacing: 2px;
  color: #8a90a0;
}

.pilot {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 240px;
}

.pilot label {
  font-size: 11px;
  letter-spacing: 2px;
  color: #8a90a0;
}

.pilot input {
  background: #12151d;
  border: 1px solid #2a3040;
  border-radius: 4px;
  color: #f2f4f8;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  padding: 8px 12px;
  outline: none;
}

.pilot input:focus {
  border-color: #6b7488;
}

.invite {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  border: 1px solid #2a3040;
  border-radius: 4px;
  padding: 10px 14px;
  background: #12151d;
  font-size: 15px;
}

.invite strong {
  letter-spacing: 1px;
}

.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid #222835;
}

.tabs button {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: #8a90a0;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 8px 14px;
  cursor: pointer;
}

.tabs button.active {
  color: #f2f4f8;
  border-bottom-color: #f2f4f8;
}

.content {
  flex: 1;
}

.cores-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
}

.core-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
  background: #12151d;
  border: 1px solid #232835;
  border-radius: 4px;
  color: #e6e8ee;
  font-family: inherit;
  padding: 12px;
  cursor: pointer;
}

.core-card:hover {
  border-color: #4a5266;
}

.core-card.selected {
  border-color: #f2f4f8;
}

.core-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.core-badge {
  font-size: 17px;
}

.core-name {
  font-size: 15px;
  font-weight: 700;
}

.core-cd {
  margin-left: auto;
  font-size: 11px;
  color: #8a90a0;
}

.core-maker {
  font-size: 12px;
  color: #aab0c0;
}

.core-desc {
  font-size: 13px;
  line-height: 1.4;
  color: #8a90a0;
}

.controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.rooms-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  color: #8a90a0;
}

.empty {
  color: #8a90a0;
  font-size: 14px;
  padding: 32px 0;
}

.room-list {
  display: flex;
  flex-direction: column;
}

.room-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 2px;
  border-bottom: 1px solid #1c212c;
  font-size: 14px;
}

.room-name {
  font-weight: 700;
}

.room-meta {
  color: #8a90a0;
  letter-spacing: 1px;
}

.room-row button {
  margin-left: auto;
}

.controls h2 {
  margin: 0 0 10px;
  font-size: 14px;
  letter-spacing: 2px;
  color: #8a90a0;
  font-weight: 700;
}

.controls ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
}

.controls li {
  display: flex;
  align-items: center;
  gap: 6px;
}

.controls p {
  font-size: 14px;
  line-height: 1.55;
  color: #aab0c0;
  margin: 0 0 10px;
}

kbd {
  background: #1c212c;
  border: 1px solid #2a3040;
  border-radius: 3px;
  padding: 1px 7px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
}

.actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  padding-top: 16px;
  border-top: 1px solid #222835;
}

button {
  font-family: inherit;
}

.primary {
  background: #f2f4f8;
  border: 1px solid #f2f4f8;
  border-radius: 4px;
  color: #0b0d12;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 10px 18px;
  cursor: pointer;
}

.primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ghost {
  background: transparent;
  border: 1px solid #2a3040;
  border-radius: 4px;
  color: #e6e8ee;
  font-size: 14px;
  font-weight: 600;
  padding: 9px 16px;
  cursor: pointer;
}

.ghost:hover:not(:disabled) {
  border-color: #6b7488;
}

.ghost:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.invite button {
  background: #f2f4f8;
  border: 1px solid #f2f4f8;
  border-radius: 4px;
  color: #0b0d12;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 14px;
  cursor: pointer;
  white-space: nowrap;
}

.invite button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.join {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.join input {
  background: #12151d;
  border: 1px solid #2a3040;
  border-radius: 4px;
  color: #f2f4f8;
  font-family: inherit;
  font-size: 14px;
  letter-spacing: 2px;
  text-transform: uppercase;
  text-align: center;
  width: 130px;
  padding: 9px 8px;
  outline: none;
}

.join input:focus {
  border-color: #6b7488;
}

@media (max-width: 640px) {
  .controls {
    grid-template-columns: 1fr;
  }

  .join {
    margin-left: 0;
  }
}
</style>
