// Import config
importScripts('config.js');

// Initialize Firestore URL
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${config.firebase.projectId}/databases/(default)/documents`;

// Helper function to make authenticated requests to Firestore
async function firestoreRequest(collection, docId = null, method = 'GET', data = null) {
    let url = `${FIRESTORE_URL}/${collection}`;
    if (docId) {
        url += `/${docId}`;
    }
    url += `?key=${config.firebase.apiKey}`;

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (data) {
        // Convert data to Firestore format
        const firestoreData = {
            fields: Object.entries(data).reduce((acc, [key, value]) => {
                let fieldValue;
                if (typeof value === 'string') {
                    fieldValue = { stringValue: value };
                } else if (typeof value === 'number') {
                    fieldValue = { integerValue: value };
                } else if (typeof value === 'boolean') {
                    fieldValue = { booleanValue: value };
                } else if (value instanceof Date || key === 'timestamp') {
                    fieldValue = { timestampValue: value };  // Already an ISO string
                } else {
                    fieldValue = { stringValue: String(value) };
                }
                acc[key] = fieldValue;
                return acc;
            }, {})
        };
        options.body = JSON.stringify(firestoreData);
    }

    console.log('Making Firestore request:', { url, method, data });
    const response = await fetch(url, options);
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Firestore request failed:', errorText);
        throw new Error(`Firestore request failed: ${response.statusText}`);
    }
    return response.json();
}

// Helper function to convert Firestore response to regular object
function convertFromFirestore(firestoreDoc) {
    if (!firestoreDoc || !firestoreDoc.fields) return null;
    
    return Object.entries(firestoreDoc.fields).reduce((acc, [key, value]) => {
        const fieldValue = Object.values(value)[0];
        // Handle different Firestore field types
        if (value.timestampValue) {
            acc[key] = fieldValue;
        } else if (value.stringValue !== undefined) {
            acc[key] = value.stringValue;
        } else if (value.integerValue !== undefined) {
            acc[key] = parseInt(value.integerValue);
        } else if (value.doubleValue !== undefined) {
            acc[key] = value.doubleValue;
        } else if (value.booleanValue !== undefined) {
            acc[key] = value.booleanValue;
        } else {
            console.warn('Unknown field type for key:', key, 'value:', value);
            acc[key] = fieldValue;
        }
        return acc;
    }, {});
}

// Helper function to migrate old data format to new
async function migrateCitationData(videoId, docId, oldData) {
    try {
        // Create new data object with citationTitle instead of source
        const newData = {
            ...oldData,
            citationTitle: oldData.source,
        };
        delete newData.source;  // Remove old field

        // Update the document with new format
        await firestoreRequest(`citations_${videoId}`, docId, 'PATCH', newData);
        console.log('Successfully migrated citation:', docId);
        return true;
    } catch (error) {
        console.error('Error migrating citation:', error);
        return false;
    }
}

// Migrate all citations in a collection from source to citationTitle
async function migrateAllCitations(videoId) {
    try {
        console.log('Starting bulk migration for video:', videoId);
        const result = await firestoreRequest(`citations_${videoId}`);
        
        if (!result.documents) {
            console.log('No documents to migrate');
            return { success: true, migratedCount: 0 };
        }

        let migratedCount = 0;
        for (const doc of result.documents) {
            const data = convertFromFirestore(doc);
            const docId = doc.name.split('/').pop();
            
            if (data.source && !data.citationTitle) {
                const newData = {
                    ...data,
                    citationTitle: data.source
                };
                delete newData.source;

                await firestoreRequest(`citations_${videoId}`, docId, 'PATCH', newData);
                migratedCount++;
            }
        }
        
        console.log(`Migration complete. Migrated ${migratedCount} documents`);
        return { success: true, migratedCount };
    } catch (error) {
        console.error('Error during bulk migration:', error);
        return { success: false, error: error.message };
    }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request);
    if (request.type === 'addCitation') {
        handleAddCitation(request.data).then(sendResponse);
        return true;
    }
    if (request.type === 'getCitations') {
        handleGetCitations(request.videoId).then(sendResponse);
        return true;
    }
    if (request.type === 'addRequest') {
        handleAddRequest(request.data).then(sendResponse);
        return true;
    }
    if (request.type === 'getRequests') {
        handleGetRequests(request.videoId).then(sendResponse);
        return true;
    }
    if (request.type === 'updateCitationVotes') {
        handleUpdateCitationVotes(request.videoId, request.citationId, request.votes, request.userVote).then(sendResponse);
        return true;
    }
    if (request.type === 'getUserVotes') {
        handleGetUserVotes(request.videoId).then(sendResponse);
        return true;
    }
    if (request.type === 'migrateAllCitations') {
        migrateAllCitations(request.videoId).then(sendResponse);
        return true;
    }
});

async function handleAddCitation(data) {
    try {
        console.log('Adding citation:', data);
        // Ensure we're using citationTitle instead of source
        const { source, ...restData } = data;
        const citation = {
            ...restData,
            citationTitle: data.citationTitle || data.source, // Handle both old and new format
            timestamp: new Date().toISOString(),
            likes: 0,
            dislikes: 0
        };
        
        const result = await firestoreRequest(`citations_${data.videoId}`, null, 'POST', citation);
        const docId = result.name.split('/').pop();
        console.log('Citation added successfully:', docId);
        return { success: true, id: docId };
    } catch (error) {
        console.error('Error adding citation:', error);
        return { success: false, error: error.message };
    }
}

async function handleGetCitations(videoId) {
    try {
        console.log('Getting citations for video:', videoId);
        // List all documents in the video's citations collection
        const result = await firestoreRequest(`citations_${videoId}`);
        
        // Convert Firestore documents to regular objects and handle migration
        const citations = result.documents ? await Promise.all(result.documents.map(async doc => {
            const data = convertFromFirestore(doc);
            const docId = doc.name.split('/').pop();

            // Check if document needs migration (has 'source' instead of 'citationTitle')
            if (data.source && !data.citationTitle) {
                await migrateCitationData(videoId, docId, data);
                // Update local data to use new field name
                data.citationTitle = data.source;
                delete data.source;
            }

            return {
                id: docId,
                ...data
            };
        })) : [];

        // Sort by timestamp descending
        citations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        console.log('Found citations:', citations.length);
        return { success: true, citations };
    } catch (error) {
        console.error('Error getting citations:', error);
        return { success: false, error: error.message };
    }
}

async function handleAddRequest(data) {
    try {
        console.log('Adding request:', data);
        // Ensure we have a valid timestamp
        const request = {
            ...data,
            timestamp: data.timestamp || new Date().toISOString()
        };
        console.log('Processed request data:', request);
        const result = await firestoreRequest(`requests_${data.videoId}`, null, 'POST', request);
        const docId = result.name.split('/').pop();
        console.log('Request added successfully:', docId);
        return { success: true, id: docId };
    } catch (error) {
        console.error('Error adding request:', error);
        return { success: false, error: error.message };
    }
}

async function handleGetRequests(videoId) {
    try {
        console.log('Getting requests for video:', videoId);
        // List all documents in the video's requests collection
        const result = await firestoreRequest(`requests_${videoId}`);
        console.log('Raw Firestore response:', result);
        
        // Convert Firestore documents to regular objects
        const requests = result.documents ? result.documents.map(doc => {
            console.log('Processing doc:', doc);
            const data = convertFromFirestore(doc);
            console.log('Converted data:', data);
            return {
                id: doc.name.split('/').pop(),
                ...data
            };
        }) : [];

        // Sort by timestamp descending, with error handling
        requests.sort((a, b) => {
            try {
                return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
            } catch (error) {
                console.error('Error sorting timestamps:', error);
                return 0;
            }
        });

        console.log('Found requests:', requests.length);
        return { success: true, requests };
    } catch (error) {
        console.error('Error getting requests:', error);
        return { success: false, error: error.message };
    }
}

async function handleUpdateCitationVotes(videoId, citationId, votes, userVote) {
    try {
        console.log('Updating citation votes:', { videoId, citationId, votes, userVote });
        
        // Get current citation data
        const citationRef = `citations_${videoId}/${citationId}`;
        const citation = await firestoreRequest(`citations_${videoId}`, citationId, 'GET');
        
        if (!citation) {
            throw new Error('Citation not found');
        }

        // Update the votes
        const updatedData = {
            ...convertFromFirestore(citation),
            likes: votes.likes,
            dislikes: votes.dislikes
        };

        // Update the document
        await firestoreRequest(`citations_${videoId}`, citationId, 'PATCH', updatedData);

        // Store user's vote in chrome.storage.local
        const storageKey = `votes_${videoId}`;
        const existingVotes = await new Promise(resolve => {
            chrome.storage.local.get(storageKey, (result) => {
                resolve(result[storageKey] || {});
            });
        });

        existingVotes[citationId] = userVote;
        await new Promise(resolve => {
            chrome.storage.local.set({ [storageKey]: existingVotes }, resolve);
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error updating citation votes:', error);
        return { success: false, error: error.message };
    }
}

async function handleGetUserVotes(videoId) {
    try {
        const storageKey = `votes_${videoId}`;
        const result = await new Promise(resolve => {
            chrome.storage.local.get(storageKey, (result) => {
                resolve(result[storageKey] || {});
            });
        });
        return { success: true, votes: result };
    } catch (error) {
        console.error('Error getting user votes:', error);
        return { success: false, error: error.message };
    }
}
