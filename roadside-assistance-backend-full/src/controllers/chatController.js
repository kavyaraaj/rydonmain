import ServiceRequest from '../models/ServiceRequest.js';
import { logger } from '../utils/logger.js';

// Send Message
export const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const request = await ServiceRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Authorization
    const isUser = req.userType === 'user' && request.user.toString() === req.user._id.toString();
    const isWorkshop = req.userType === 'workshop' && 
      request.assignedWorkshop?.toString() === req.workshop._id.toString();

    if (!isUser && !isWorkshop) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Prepare message object
    const chatMessage = {
      senderRole: req.userType === 'user' ? 'user' : 'workshop',
      senderId: req.userType === 'user' ? req.user._id : req.workshop._id,
      senderName: req.userType === 'user' ? req.user.name : req.workshop.name,
      message,
      timestamp: new Date()
    };

    request.chat.push(chatMessage);
    await request.save();

    // Emit Socket.IO event
    const io = req.app.get('io');
    io.to(`request_${request._id}`).emit('receive_message', {
      requestId: request._id,
      message: chatMessage
    });

    res.status(201).json({
      message: 'Message sent successfully',
      chatMessage
    });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Get Chat History
export const getChatHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ServiceRequest.findById(id).select('chat user assignedWorkshop');
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Authorization
    const isUser = req.userType === 'user' && request.user.toString() === req.user._id.toString();
    const isWorkshop = req.userType === 'workshop' && 
      request.assignedWorkshop?.toString() === req.workshop._id.toString();

    if (!isUser && !isWorkshop) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      chat: request.chat
    });
  } catch (error) {
    logger.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};