// importing
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from "pusher";
import cors from 'cors';


// app config 
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: '1075694',
    key: '9b69f604c6442faa8865',
    secret: '743b55459f51983e5d23',
    cluster: 'us2',
    encrypted: true
  });


// middleware
app.use(express.json())
app.use(cors());


// DB config
const connection_url = 'mongodb+srv://admin:C1avvoC5FKSV2nDF@cluster0.rukxn.mongodb.net/whatsappdb?retryWrites=true&w=majority';

mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.once('open', () => {
    console.log('THE DB IS READY FOR YOUR CONVO');

    const msgCollection = db.collection('messagecontents');
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log("Update occured", change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted',
            {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            }
          );
        } else {
            console.log('Pusher has ran into an error');
        }
    });


});

//???

// API routes
app.get('/', (req, res) => res.status(200).send('hello guys'));

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        }
        else {
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err)
        }
        else {
            res.status(201).send(`new message created: \n ${data}`)
        }
    })
})

// listen
app.listen(port, () => console.log(`Listening on localhost:${port}`));