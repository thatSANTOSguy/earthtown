// ============================================
// MUSIC MODULE - Audio playback & queue management
// ============================================

import { collection, query, onSnapshot, addDoc, updateDoc, doc, getDocs, where } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Music state
export let currentTrackIndex = 0;
export let isPlaying = false;
export let inPodMode = false;
export let roomQueue = [];
export let podQueue = [];
export let queueUnsubscribe = null;

// Audio element will be passed from room.html
let audioElement = null;

/**
 * Initialize music module with audio element
 */
export function initMusic(audio) {
    audioElement = audio;
}

/**
 * Play a track by index
 */
export function playTrack(index, getCurrentQueue) {
    const currentQueue = getCurrentQueue();
    if (!currentQueue || currentQueue.length === 0) return;
    
    currentTrackIndex = Math.max(0, Math.min(index, currentQueue.length - 1));
    const track = currentQueue[currentTrackIndex];
    
    if (!track) return;
    
    // Update now playing display
    if (window.updateNowPlaying) {
        window.updateNowPlaying(track);
    }
    
    // Play audio
    if (track.url) {
        audioElement.src = track.url;
        audioElement.play().then(() => {
            isPlaying = true;
            const playBtn = document.getElementById('playBtn');
            if (playBtn) playBtn.textContent = '⏸';
        }).catch(err => console.log('Playback failed:', err));
    }
}

/**
 * Toggle play/pause
 */
export function togglePlayback(getCurrentQueue) {
    if (!audioElement.src) {
        playTrack(0, getCurrentQueue);
        return;
    }
    
    if (isPlaying) {
        audioElement.pause();
        isPlaying = false;
        const playBtn = document.getElementById('playBtn');
        if (playBtn) playBtn.textContent = '▶';
    } else {
        audioElement.play();
        isPlaying = true;
        const playBtn = document.getElementById('playBtn');
        if (playBtn) playBtn.textContent = '⏸';
    }
}

/**
 * Play next track
 */
export function nextTrack(getCurrentQueue) {
    const currentQueue = getCurrentQueue();
    if (currentQueue.length === 0) return;
    playTrack((currentTrackIndex + 1) % currentQueue.length, getCurrentQueue);
}

/**
 * Play previous track
 */
export function previousTrack(getCurrentQueue) {
    const currentQueue = getCurrentQueue();
    if (currentQueue.length === 0) return;
    const newIndex = currentTrackIndex - 1;
    playTrack(newIndex < 0 ? currentQueue.length - 1 : newIndex, getCurrentQueue);
}

/**
 * Toggle between pod and room queue mode
 */
export function toggleQueueMode(callbacks) {
    inPodMode = !inPodMode;
    
    const btn = document.getElementById('modeToggleBtn');
    const indicator = document.getElementById('modeIndicator');
    
    if (inPodMode) {
        if (btn) {
            btn.innerHTML = '🎧 private pod';
            btn.style.background = 'rgba(106, 76, 147, 0.2)';
            btn.style.color = '#6a4c93';
        }
        if (indicator) {
            indicator.innerHTML = '🎧 private pod';
            indicator.style.color = '#6a4c93';
        }
        if (callbacks.onPodModeActivate) callbacks.onPodModeActivate();
    } else {
        if (btn) {
            btn.innerHTML = '🌍 shared queue';
            btn.style.background = 'rgba(127, 194, 155, 0.2)';
            btn.style.color = '#7fc29b';
        }
        if (indicator) {
            indicator.innerHTML = '🌍 shared queue';
            indicator.style.color = '#7fc29b';
        }
        if (callbacks.onSharedModeActivate) callbacks.onSharedModeActivate();
    }
    
    // Stop current playback when switching modes
    if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
        isPlaying = false;
        const playBtn = document.getElementById('playBtn');
        if (playBtn) playBtn.textContent = '▶';
    }
    
    if (callbacks.onModeChange) callbacks.onModeChange();
}

/**
 * Load room queue from Firebase
 */
export function listenToRoomQueue(db, roomName, callbacks) {
    const queueRef = collection(db, 'rooms', roomName, 'queue');
    const queueQuery = query(queueRef);
    
    queueUnsubscribe = onSnapshot(queueQuery, (snapshot) => {
        roomQueue = [];
        snapshot.forEach((doc) => {
            roomQueue.push({ id: doc.id, ...doc.data() });
        });
        
        console.log('Room queue updated, tracks:', roomQueue.length);
        if (callbacks.onRoomQueueUpdate) {
            callbacks.onRoomQueueUpdate(roomQueue);
        }
    });
}

/**
 * Stop listening to room queue
 */
export function stopListeningToQueue() {
    if (queueUnsubscribe) {
        queueUnsubscribe();
        queueUnsubscribe = null;
    }
}

/**
 * Save pod queue to localStorage
 */
export function savePodToStorage(queue) {
    try {
        localStorage.setItem('earthtown_pod_queue', JSON.stringify(queue));
        console.log('Pod saved to localStorage');
    } catch (error) {
        console.error('Failed to save pod:', error);
    }
}

/**
 * Load pod queue from localStorage
 */
export function loadPodFromStorage() {
    try {
        const saved = localStorage.getItem('earthtown_pod_queue');
        if (saved) {
            podQueue = JSON.parse(saved);
            console.log('✓ Loaded', podQueue.length, 'tracks from localStorage');
            return podQueue;
        }
    } catch (e) {
        console.error('Failed to load pod:', e);
    }
    return [];
}

/**
 * Set room queue (for pre-loaded playlists)
 */
export function setRoomQueue(tracks) {
    roomQueue = tracks;
}

/**
 * Set pod queue
 */
export function setPodQueue(tracks) {
    podQueue = tracks;
}

/**
 * Get current queue based on mode
 */
export function getCurrentQueue() {
    return inPodMode ? podQueue : roomQueue;
}
