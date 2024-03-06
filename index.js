const TelegramBot=require('node-telegram-bot-api');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore} = require('firebase-admin/firestore');

var serviceAccount=require("./key.json");

function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
}



initializeApp({
    credential:cert(serviceAccount)
});
const token='6636525431:AAHZPfgpHUa2f6byguU4bOVg_RRchnsNIFU';
const bot=new TelegramBot(token,{polling:true});

const db =getFirestore();

bot.onText(/\/add (.+)/, (msg, match) => {
    
  
    const chatId = msg.chat.id;
    const task=match[1];
    const resp =(task)? '"'+String(task)+'"'+" added to todo list":'Enter the task properly'; 
    
    db.collection('Todo').add({
        name:task,
        time:getCurrentTime()
    });
    bot.sendMessage(chatId, resp);
  });

bot.onText(/\/remove (.+)/,(msg,match)=>{
    const chatId =msg.chat.id;
    const taskToDelete = match[1];

    if (taskToDelete) {
        
        db.collection('Todo')
            .where('name', '==', taskToDelete)
            .get()
            .then(snapshot => {
                if (snapshot.empty) {
                    
                    bot.sendMessage(chatId, `Task "${taskToDelete}" not found.`);
                } else {
                    
                    snapshot.forEach(doc => {
                        db.collection('Todo').doc(doc.id).delete();
                        bot.sendMessage(chatId, `Task "${taskToDelete}" removed from todo list.`);
                    });
                }
            })
            .catch(error => {
                console.error('Error getting documents: ', error);
                bot.sendMessage(chatId, 'An error occurred while deleting the task.');
            });
    } else {
        bot.sendMessage(chatId, 'Enter the task properly.');
    }
});

bot.onText(/\/start/,(msg)=>{
    const chatId = msg.chat.id;
    const message="Available commands\n/add taskname --> to add new task\n /remove taskname --> to remove task\n /view --> to view tasks"
    bot.sendMessage(chatId,message);
})
bot.onText(/\/view/, (msg) => {
    const chatId = msg.chat.id;

    var table_message = "Task name" + "    " + "created Time\n";
    db.collection('Todo').get().then((docs) => {
        if (docs.empty) {
            bot.sendMessage(chatId, "No tasks found");
        } else {
            docs.forEach(doc => {
                console.log(doc.data().name + "    " + doc.data().time + "\n");
                table_message += doc.data().name + "    " + doc.data().time + "\n";
            });
            console.log(table_message);
            bot.sendMessage(chatId, table_message);
        }
    }).catch(error => {
        console.error('Error getting documents: ', error);
        bot.sendMessage(chatId, 'An error occurred while fetching the tasks.');
    });
});
