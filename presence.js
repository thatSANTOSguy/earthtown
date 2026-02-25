// ============================================
// PRESENCE MODULE - Avatar tracking & heartbeat
// ============================================

import { doc, setDoc, updateDoc, deleteDoc, collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// State
let presenceInterval = null;
let presenceUnsubscribe = null;

/**
 * Join a room - create presence document and start heartbeat
 */
export async function joinRoom(db, roomName, currentUser, currentUserData) {
    try {
        // Update user's current room
        await updateDoc(doc(db, 'users', currentUser.uid), {
            currentRoom: roomName,
            lastSeen: new Date().toISOString()
        });

        // Create or update user's presence in room
        const presenceDocRef = doc(db, 'rooms', roomName, 'presence', currentUser.uid);
        await setDoc(presenceDocRef, {
            userId: currentUser.uid,
            username: currentUserData.username,
            archetype: currentUserData.archetype,
            characterImage: currentUserData.characterImage,
            x: currentUserData.x,
            y: currentUserData.y,
            joinedAt: new Date().toISOString(),
            lastSeen: new Date().toISOString()
        });

        console.log('✓ Joined room:', roomName);
    } catch (error) {
        console.error('Error joining room:', error);
    }
}

/**
 * Start presence heartbeat - updates lastSeen every 30 seconds
 */
export function startPresenceHeartbeat(db, roomName, currentUser) {
    // Clear any existing interval
    if (presenceInterval) clearInterval(presenceInterval);
    
    presenceInterval = setInterval(async () => {
        if (!currentUser) {
            clearInterval(presenceInterval);
            return;
        }
        
        try {
            const presenceDocRef = doc(db, 'rooms', roomName, 'presence', currentUser.uid);
            await updateDoc(presenceDocRef, {
                lastSeen: new Date().toISOString()
            });
            console.log('💓 Presence heartbeat updated');
        } catch (error) {
            console.log('Presence update failed (user may have left)');
        }
    }, 30000); // Every 30 seconds
    
    console.log('✓ Presence heartbeat started');
}

/**
 * Stop presence heartbeat
 */
export function stopPresenceHeartbeat() {
    if (presenceInterval) {
        clearInterval(presenceInterval);
        presenceInterval = null;
    }
}

/**
 * Listen to room presence updates
 */
export function listenToRoomPresence(db, roomName, currentUser, currentUserData, callbacks) {
    console.log('👥 Setting up room presence listener for room:', roomName);
    const presenceRef = collection(db, 'rooms', roomName, 'presence');
    
    presenceUnsubscribe = onSnapshot(presenceRef, (snapshot) => {
        console.log('📡 Presence snapshot received, size:', snapshot.size);
        const usersInRoom = [];
        
        snapshot.forEach((docSnapshot) => {
            console.log('Processing user:', docSnapshot.id, docSnapshot.data());
            const userData = docSnapshot.data();
            
            // Check if presence is stale and clean it up
            const lastSeen = userData.lastSeen;
            if (lastSeen) {
                const timeSince = Date.now() - new Date(lastSeen).getTime();
                if (timeSince > 120000) { // 2 minutes
                    // Delete stale presence doc
                    console.log('🧹 Deleting stale presence for:', docSnapshot.id);
                    deleteDoc(docSnapshot.ref).catch(err => console.log('Failed to delete stale presence'));
                    return; // Don't add to usersInRoom
                }
            } else {
                // No lastSeen field = old doc from before this feature, clean it up
                console.log('🧹 Deleting old presence (no lastSeen) for:', docSnapshot.id);
                deleteDoc(docSnapshot.ref).catch(err => console.log('Failed to delete old presence'));
                return; // Don't add to usersInRoom
            }
            
            if (docSnapshot.id !== currentUser.uid) {
                usersInRoom.push({
                    id: docSnapshot.id,
                    ...userData
                });
            } else {
                // Update currentUserData position from Firebase if not dragging
                if (callbacks.onCurrentUserUpdate) {
                    callbacks.onCurrentUserUpdate(userData);
                }
            }
        });
        
        // Notify caller with updated users list
        if (callbacks.onUsersUpdate) {
            callbacks.onUsersUpdate(usersInRoom);
        }
    });
    
    console.log('✓ Presence listener attached');
}

/**
 * Stop listening to presence updates
 */
export function stopListeningToPresence() {
    if (presenceUnsubscribe) {
        presenceUnsubscribe();
        presenceUnsubscribe = null;
    }
}

/**
 * Update user's position in presence
 */
export async function updateUserPosition(db, roomName, currentUser, x, y) {
    try {
        await updateDoc(
            doc(db, 'rooms', roomName, 'presence', currentUser.uid),
            { x, y }
        );
    } catch (error) {
        console.error('Error updating position:', error);
    }
}

/**
 * Leave room - delete presence document
 */
export async function leaveRoom(db, roomName, currentUser) {
    try {
        const presenceDocRef = doc(db, 'rooms', roomName, 'presence', currentUser.uid);
        await deleteDoc(presenceDocRef);
        console.log('✓ Presence deleted');
    } catch (error) {
        console.log('Presence cleanup failed (fallback will handle it)');
    }
}
