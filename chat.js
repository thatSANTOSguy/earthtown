// ============================================
// CHAT MODULE - Messaging functionality
// ============================================

import { collection, query, orderBy, limit, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { ref, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// State
let messagesUnsubscribe = null;

/**
 * Listen to room messages
 */
export function listenToRoomMessages(db, storage, roomName, callbacks) {
    try {
        console.log('💬 Setting up chat message listener for room:', roomName);
        const messagesRef = collection(db, 'rooms', roomName, 'messages');
        console.log('✓ messagesRef created');
        const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));
        console.log('✓ messagesQuery created');
        
        messagesUnsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            console.log('📨 Messages snapshot received, size:', snapshot.size);
            const messages = [];
            snapshot.forEach((doc) => {
                messages.push({ id: doc.id, ...doc.data() });
            });
            
            // Reverse to show oldest first
            messages.reverse();
            
            // Callback to render messages
            if (callbacks.onMessagesUpdate) {
                callbacks.onMessagesUpdate(messages, storage);
            }
        });
        console.log('✓ Chat listener attached');
    } catch (error) {
        console.error('💥 CHAT SETUP ERROR:', error);
    }
}

/**
 * Stop listening to messages
 */
export function stopListeningToMessages() {
    if (messagesUnsubscribe) {
        messagesUnsubscribe();
        messagesUnsubscribe = null;
    }
}

/**
 * Send a message
 */
export async function sendMessage(db, roomName, currentUser, currentUserData, text) {
    if (!currentUserData) return;

    try {
        await addDoc(
            collection(db, 'rooms', roomName, 'messages'),
            {
                userId: currentUser.uid,
                username: currentUserData.username,
                archetype: currentUserData.archetype,
                characterImage: currentUserData.characterImage,
                text: text,
                timestamp: new Date().toISOString()
            }
        );
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

/**
 * Delete a message (mark as deleted or remove completely)
 */
export async function deleteMessage(db, roomName, currentUser, currentUserData, messageId, removeCompletely) {
    if (!currentUser) return;
    
    const isAdmin = currentUserData && currentUserData.isAdmin === true;
    
    // Confirm action
    const action = removeCompletely ? 'remove' : 'delete';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this message?`)) {
        return;
    }
    
    try {
        if (removeCompletely && isAdmin) {
            // Admin remove: delete completely (no trace)
            await deleteDoc(doc(db, 'rooms', roomName, 'messages', messageId));
            console.log('Message removed completely');
        } else {
            // Regular delete: mark as deleted (shows placeholder)
            await updateDoc(doc(db, 'rooms', roomName, 'messages', messageId), {
                deleted: true,
                text: '[message deleted]',
                username: '[deleted]'
            });
            console.log('Message marked as deleted');
        }
    } catch (error) {
        console.error('Error deleting message:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        alert(`Failed to delete message: ${error.message}`);
    }
}

/**
 * Wipe all messages in a room (admin only)
 */
export async function wipeChat(db, roomName, currentUser, currentUserData) {
    if (!currentUser || !currentUserData || !currentUserData.isAdmin) {
        alert('Admin only');
        return;
    }
    
    if (!confirm('WIPE ALL MESSAGES in this room? This cannot be undone!')) {
        return;
    }
    
    try {
        const messagesRef = collection(db, 'rooms', roomName, 'messages');
        const snapshot = await getDocs(messagesRef);
        
        const deletePromises = [];
        snapshot.forEach(doc => {
            deletePromises.push(deleteDoc(doc.ref));
        });
        
        await Promise.all(deletePromises);
        alert(`Wiped ${deletePromises.length} messages`);
        console.log('Chat wiped');
    } catch (error) {
        console.error('Error wiping chat:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        alert(`Failed to wipe chat: ${error.message}`);
    }
}

/**
 * Create a message element for rendering
 */
export function createMessageElement(msg, currentUser, currentUserData, storage, getArchetypeColor) {
    const placeholderColor = getArchetypeColor(msg.archetype);
    
    // Format timestamp
    const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
    }) : '';
    
    const msgId = `msg-${Date.now()}-${Math.random()}`;
    
    // Check if current user can delete (own message) or is admin
    const isOwnMessage = currentUser && msg.userId === currentUser.uid;
    const isAdmin = currentUserData && currentUserData.isAdmin === true;
    
    // Build delete buttons
    let deleteButtons = '';
    if (isOwnMessage || isAdmin) {
        deleteButtons = `<button onclick="deleteMessage('${msg.id}', false)" style="background: none; border: none; color: #d62828; cursor: pointer; font-size: 0.85rem; padding: 0 5px; opacity: 0.6; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'" title="Delete (shows deleted)">delete</button>`;
    }
    if (isAdmin) {
        deleteButtons += `<button onclick="deleteMessage('${msg.id}', true)" style="background: none; border: none; color: #f77f00; cursor: pointer; font-size: 0.85rem; padding: 0 5px; opacity: 0.6; transition: opacity 0.2s; margin-left: 5px;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'" title="Remove (no trace)">remove</button>`;
    }
    
    const div = document.createElement('div');
    div.className = 'message';
    
    // Check if message is deleted
    if (msg.deleted) {
        div.innerHTML = `
            <div class="message-avatar" style="background: rgba(214, 40, 40, 0.2);"></div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author" style="color: #888;">[deleted]</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-text" style="color: #666; font-style: italic;">[message deleted]</div>
            </div>
        `;
    } else {
        div.innerHTML = `
            <div class="message-avatar" id="${msgId}" style="background: ${placeholderColor};"></div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author archetype-${msg.archetype}">${msg.username}</span>
                    <span class="message-time">${time}</span>
                    ${deleteButtons}
                </div>
                <div class="message-text">${msg.text}</div>
            </div>
        `;
        
        // Load character image for message
        if (msg.characterImage) {
            loadMessageCharacterImage(storage, msgId, msg.characterImage);
        }
    }
    
    return div;
}

/**
 * Load character image for a message avatar
 */
async function loadMessageCharacterImage(storage, msgId, characterImagePath) {
    try {
        const charRef = ref(storage, characterImagePath);
        const charURL = await getDownloadURL(charRef);
        
        const msgAvatar = document.getElementById(msgId);
        if (msgAvatar) {
            msgAvatar.style.background = 'none';
            msgAvatar.innerHTML = `<img src="${charURL}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px; image-rendering: pixelated;">`;
        }
    } catch (error) {
        console.log('Could not load message character image');
    }
}
