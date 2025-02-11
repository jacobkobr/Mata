const { app } = require('electron');
const fs = require('fs');
const path = require('path');

// Get the user data directory
const USER_DATA_DIR = app.getPath('userData');
const CHATS_FILE = path.join(USER_DATA_DIR, 'chats.json');
const MESSAGES_FILE = path.join(USER_DATA_DIR, 'messages.json');

// Initialize storage files if they don't exist
function initStorage() {
  try {
    if (!fs.existsSync(CHATS_FILE)) {
      fs.writeFileSync(CHATS_FILE, JSON.stringify([]));
    }
    if (!fs.existsSync(MESSAGES_FILE)) {
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Failed to initialize storage:', error);
  }
}

// Chat operations
function getAllChats() {
  try {
    const data = fs.readFileSync(CHATS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read chats:', error);
    return [];
  }
}

function createChat(chat) {
  try {
    const chats = getAllChats();
    chats.push(chat);
    fs.writeFileSync(CHATS_FILE, JSON.stringify(chats, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to create chat:', error);
    return false;
  }
}

function updateChat(chat) {
  try {
    const chats = getAllChats();
    const index = chats.findIndex(c => c.id === chat.id);
    if (index !== -1) {
      chats[index] = chat;
      fs.writeFileSync(CHATS_FILE, JSON.stringify(chats, null, 2));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to update chat:', error);
    return false;
  }
}

function deleteChat(chatId) {
  try {
    const chats = getAllChats();
    const filteredChats = chats.filter(chat => chat.id !== chatId);
    fs.writeFileSync(CHATS_FILE, JSON.stringify(filteredChats, null, 2));
    
    // Also delete associated messages
    const messages = getAllMessages();
    const filteredMessages = messages.filter(msg => msg.chatId !== chatId);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(filteredMessages, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to delete chat:', error);
    return false;
  }
}

// Message operations
function getAllMessages() {
  try {
    const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read messages:', error);
    return [];
  }
}

function getChatMessages(chatId) {
  try {
    const messages = getAllMessages();
    return messages.filter(msg => msg.chatId === chatId);
  } catch (error) {
    console.error('Failed to get chat messages:', error);
    return [];
  }
}

function addMessage(message) {
  try {
    const messages = getAllMessages();
    messages.push(message);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to add message:', error);
    return false;
  }
}

// Initialize storage on module load
initStorage();

module.exports = {
  getAllChats,
  createChat,
  updateChat,
  deleteChat,
  getChatMessages,
  addMessage,
}; 