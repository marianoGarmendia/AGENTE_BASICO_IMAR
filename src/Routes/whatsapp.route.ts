import {Router} from 'express';

const wspRouter = Router();

wspRouter.post('/send', async (req, res) => {
    const { business_phone_number_id, WEBHOOK_VERIFY_TOKEN, template } = req.body;
    
    try {
        const response = await fetch(
        `https://graph.facebook.com/v22.0/${business_phone_number_id}/messages`,
        {
            method: 'POST',
            headers: {
            Authorization: `Bearer ${WEBHOOK_VERIFY_TOKEN}`,
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(template),
        }
        );
    
        const result = await response.json();
    
        if (response.ok) {
        res.status(200).json({ message: 'Message sent successfully', result });
        } else {
        res.status(response.status).json({ error: result.error.message });
        }
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})