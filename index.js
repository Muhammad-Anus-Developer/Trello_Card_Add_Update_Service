// const Trello = require('trello');
import Trello from 'node-trello';
import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

const app = express();


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: false
}))


const trello = new Trello(process.env.APIKEY, process.env.APITOKEN);


const response = await fetch(`https://api.trello.com/1/boards/${process.env.BOARDID}/lists?key=${process.env.APIKEY}&token=${process.env.APITOKEN}`);
const lists = await response.json();
const listsWithIdAndName = lists.map((list) => ({
  id: list.id,
  name: list.name,
}));
console.log(listsWithIdAndName);





// Endpoint to get email data with attachments
app.get('/', async (req, res) => {

  res.status(200).json({
    message: "Hello World"
  });


});














app.post("/card/create", async (req, res) => {

  const {
    name,
    description,
    attachmentUrl
  } = req.body;

  const apiKey = process.env.APIKEY;
  const apiToken = process.env.APITOKEN;
  const boardId = process.env.BOARDID;
  const listId = process.env.LISTID;


  try {

  trello.get(`/1/boards/${boardId}/cards`, {
    fields: ['name', 'desc']
  }, async (error, cards) => {
    if (error) {
      console.error(error);
      return;
    }

    console.log(cards);
    // Check if a card with the specified name exists in the list of cards
    const matchingCards = cards.filter(card => card.name === name);
    if (matchingCards.length > 0) {

      async function addAttachment(attachmentUrl) {
        const response = await fetch(`https://api.trello.com/1/cards/${matchingCards[0]?.id}/attachments?key=${apiKey}&token=${apiToken}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: attachmentUrl,
          }),
        });
      
        const data = await response.json();
      
        return data.id;
      }
      
      const response = await fetch(`https://api.trello.com/1/cards/${matchingCards[0]?.id}?key=${apiKey}&token=${apiToken}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          desc : description,
          idAttachment: await addAttachment(attachmentUrl),
        }),
      });
  


      const moveCardUrl = `https://api.trello.com/1/cards/${matchingCards[0]?.id}?idList=${process.env.LISTID2}&key=${apiKey}&token=${apiToken}`;
      await fetch(moveCardUrl, {
        method: 'PUT'
      });

      const data = await response.json();
  
      res.json({ success: true, data });
    






      console.log('Card exists');
    } else {

      const url = `https://api.trello.com/1/cards?key=${apiKey}&token=${apiToken}&idList=${listId}&name=${name}&desc=${description}&idBoard=${boardId}`;

      const response = await fetch(url, {
        method: 'POST'
      });
      const data = await response.json();
      const cardId = data?.id;
  
  
      const formData = new FormData();
      const attachmentResponse = await fetch(attachmentUrl);
      const attachmentData = await attachmentResponse.buffer();
      formData.append('file', attachmentData, {
        filename: 'attachment'
      });
      const attachUrl = `https://api.trello.com/1/cards/${cardId}/attachments?key=${apiKey}&token=${apiToken}`;
      const attachResponse = await fetch(attachUrl, {
        method: 'POST',
        body: formData,
      });
  
  
  
  
      res.send(data);

      console.log('Card does not exist');
    }
  });


























  // console.log(description, name, attachmentUrl);


  
  } catch (error) {
    console.log(error);
    res.status(500).send({
      error: 'Error creating Trello card'
    });
  }

})





app.listen(3000, () => {
  console.log('Server listening on port 3000');
});