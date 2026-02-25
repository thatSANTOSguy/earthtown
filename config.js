// ============================================
// EARTHTOWN ROOM CONFIGURATION
// ============================================

// Firebase Configuration
export const firebaseConfig = {
    apiKey: "AIzaSyCXFlGeJodOUVn-3bYocPhFRtzs9DBHEFA",
    authDomain: "earthtown-92993.firebaseapp.com",
    projectId: "earthtown-92993",
    storageBucket: "earthtown-92993.firebasestorage.app",
    messagingSenderId: "830730193161",
    appId: "1:830730193161:web:af18953dd80872b1396bd8",
    measurementId: "G-KC30SQWHEC"
};

// Room Playlists - Pre-loaded tracks for each room
export const roomPlaylists = {
    sanctuary: [
        // Meditation playlist - add track info when ready
        // { title: "Track Title", artist: "Artist Name", url: "./track1.MP3" }
    ],
    studio: [
        // Alive & Well - EP by CLOUD5 & santos bluː
        { title: "Love or War", artist: "CLOUD5 & santos bluː", url: "./aw1.MP3" },
        { title: "13 Bricks", artist: "CLOUD5 & santos bluː", url: "./aw2.MP3" },
        { title: "Filet Mignon", artist: "CLOUD5 & santos bluː", url: "./aw3.MP3" },
        { title: "we were gonna call it alive n well (interlude)", artist: "CLOUD5 & santos bluː", url: "./aw4.MP3" },
        { title: "3", artist: "CLOUD5 & santos bluː", url: "./aw5.MP3" },
        { title: "Fluid, Go Stupid !", artist: "CLOUD5 & santos bluː", url: "./aw6.MP3" }
    ],
    supernaturvl: [
        // SUPERNATURVL EP
        { title: "Track 1", artist: "Your Artist Name", url: "./sn1.MP3" },
        { title: "Track 2", artist: "Your Artist Name", url: "./sn2.MP3" },
        { title: "Track 3", artist: "Your Artist Name", url: "./sn3.MP3" },
        { title: "Track 4", artist: "Your Artist Name", url: "./sn4.MP3" }
    ],
    gathering: [] // Empty - users upload
};

// Room Configurations - Settings for each room
export const roomConfigs = {
    sanctuary: { 
        icon: '🌙', 
        name: 'the sanctuary',
        uploadsAllowed: false,
        forceMode: null // 'solo' or 'room' or null for choice
    },
    studio: { 
        icon: '🎙️', 
        name: 'the studio',
        uploadsAllowed: false,
        forceMode: null,
        showModeModal: true // Show choice modal on entry
    },
    gathering: { 
        icon: '🌍', 
        name: 'the gathering',
        uploadsAllowed: true,
        forceMode: null // User can toggle
    },
    supernaturvl: { 
        icon: '👁️', 
        name: 'SUPERNATURVL',
        uploadsAllowed: false,
        forceMode: 'solo' // Always solo mode
    }
};
