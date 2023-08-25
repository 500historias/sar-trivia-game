require('dotenv').config();
// const uuid = process.env.UUID;
// const secretKey = process.env.SECRET_KEY;
// const port = process.env.PORT;
const port = process.env.PORT;
const uuid = process.env.UUID
const secretKey = process.env.SECRET_KEY

const express = require('express'); //import express
const express_instance = express(); //create an instance of Express

const cors = require('cors');

const SarLib = require("@500historias/sarlib");
// const SarLib = require("./sarlib");

const sqlite3 = require('sqlite3').verbose();

let user_id;


//Work with better pathing
const path = require('path');
// Specify the parent directory and file name
const parentDirectory = path.join(__dirname, './'); // ".." represents the parent directory
const subDirectoryDatabase = './Database'
const fileNameDatabase = 'trivia_game.db';
// Construct the full file path Database and Questions
const filePathDatabase = path.join(parentDirectory, subDirectoryDatabase, fileNameDatabase);


// Connect to the SQLite database using the dynamic file path and handle error
const database_trivia_game = new sqlite3.Database(filePathDatabase, sqlite3.OPEN_READWRITE, (error) => {
  if (error) {
    console.error(err.message);
  }
  else{
    console.log('Connection to the database was successful');
    // console.log(filePathDatabase);
  }
});

//CORS section?
express_instance.use(cors()); //CORS 

//SAR lib section
express_instance.use(SarLib.useExpress({uuid: uuid , secretKey: secretKey, testMode: false}))

express_instance.use(express.static('public'))

//'sar' is the address of the request, the complete address is: http://localhost:3000/sarlib
express_instance.get('/sarlib', (req, res) => {
  req.sar.getUser(req.query.userId).then((user) => {
  console.log(`The userId of the request is: ${user}`);
  res.send(user);
}).catch((err) => {
  res.send(err);
  console.log(`The error is: ${err}`);
});
})

function get_question_id(user_id_place_holder){
  return new Promise((resolve, reject) => {
      database_trivia_game.all(`
      select q.q_id from question q
      where q.q_id not in
          (select q_id from quest_users qu 
            where qu.u_id = ${user_id_place_holder}
              and qu.result = TRUE)
        and q.diff = (
          select level from user u
          where u.u_id = ${user_id_place_holder}
        )
      order by random()
      limit 1`, (error_fetch_question, question_fetched) =>{
        if (error_fetch_question) {
          reject(error_fetch_question);
        }
        else if (!question_fetched.length){
          database_trivia_game.get(`select level from user where u_id = ${user_id_place_holder}`, (error, row) => {
            if (error) {
              reject(error);
            } else if (row.level < 3) {
              database_trivia_game.run(`update user 
              set level = level+1 where u_id = ${user_id_place_holder}`, (error_updating_user) =>{
                if(error_updating_user){
                  reject(error_updating_user);
                }else{
                  // User level updated, call the function again
                  get_question_id(user_id_place_holder).then(resolve).catch(reject);
                }
              })
            } else {
              resolve('');
            }
          });
        } else {
          const q_id = question_fetched[0].q_id;
          resolve(q_id);
        }
      })
  })
}

//SQLite3 section
function fetch_user_created(user_id){
  return new Promise((resolve, reject) => {
    if (user_id === null || user_id === undefined) reject();
    database_trivia_game.all(`select * from user u where u.u_id = ${user_id}`, async (error_call_select, rows_from_select) =>{
      if (error_call_select) {
        console.log(error_call_select);
        await insert_values_database(user_id);
        console.log('Value inserted \n');
        resolve(); }
      if(rows_from_select === null || rows_from_select.length === 0) await insert_values_database(user_id);
        // console.log("User fecthed\n")
        resolve(rows_from_select);
    });
  })
}

function insert_values_database(user_id_place_holder){
  return new Promise(async (resolve, reject) => {
    database_trivia_game.run(`insert into user values(${user_id_place_holder}, 1)`, (error_insert_user) => {
      if (error_insert_user) {
        console.log('User already exists \n')
        resolve()
      }else{
        console.log('User created \n')
        resolve()
      }
    });
  })
}

function get_question(q_id){
  return new Promise((resolve, reject) =>{
      database_trivia_game.all(`select * from question q where q.q_id = ${q_id}`, (error_call_question, rows_from_select) =>{
        if (error_call_question) {
          reject('');
        }
        // console.log("Question got")
        resolve(rows_from_select);
    })})
}

function updateQuestionStatusForUser(status, question_id){
  const currentTime = new Date();
  return new Promise((resolve, reject) =>{
    database_trivia_game.run(`insert into quest_users values(${question_id}, ${user_id}, '${currentTime.toISOString()}', ${status})`, (error_inserting_question) =>{
      if (error_inserting_question) {
        database_trivia_game.run(`update quest_users set result = ${status} where(q_id = ${question_id} and u_id = ${user_id})`, (error_updating_question) =>{
          if (error_updating_question) {
            console.log(`Could not insert: ${error_updating_question}`)
            reject('')
          }
          else{
            console.log('Entry updated')
            resolve('')
          }
        })
      }
      else{
        console.log('Entry inserted')
        resolve('')
      }
    })
  })
}

//middleware to parse json
express_instance.use(express.json());
//Envia informacion al frontend

express_instance.get('/question', async (req, res) => { 
  user_id = req.query.userId
  //'question' is the address of the request, the complete address is: http://localhost:3000/question
  try{
    // const user_fecthed = await fetch_user_created(req.query.userId);
    const user_fecthed = await fetch_user_created(user_id);

    // const question_id_fecthed = await get_question_id(req.query.userId)
    const question_id_fecthed = await get_question_id(user_id)

    const question_fecthed = await get_question(question_id_fecthed);
    // const question_fecthed = await get_question(question_id_fecthed);

    const sar_User = await req.sar.getUser(user_id);

    // console.log(sar_User);
    console.log(user_id)
    // console.log(`${question_fecthed}\n`)
    res.json(question_fecthed);
  }
  catch(error){
    console.error('Error /question: ', error) //para el usuario
    res.status(500).send; //para el servidor
  }
});


//Recibe informacion del frontend
express_instance.post('/answer', async(req, res) =>{
  let answer = req.body
  let status = answer.Status
  let user_Id_url = parseInt(req.query.userId)
  // let status = true
  let question_id = answer.Question_ID
  try{
    const request_to_Sar = await req.sar.finishChallenge(user_Id_url, status)
    // const downgrade_level = await changeUserLevelToOne()
    const update_question_status = await updateQuestionStatusForUser(status, question_id)
    // console.log(status);
    // console.log(answer.Question_ID);
  }
  catch(error){
    console.error(`Error /answer: ${error}` )
  }
});

function changeUserLevelToOne(){
  return new Promise((resolve, reject) =>{
    database_trivia_game.run(`update user
    SET level = 1 
    WHERE u_id = 1`, (error, level_downdated) => {
      if (error){
        reject(error)
      }
      else{
        console.log('Level downgraded')
        resolve('')
      }
    })
  })
}
express_instance.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('');
});

database_trivia_game.on('error', (error) => {
  console.error('Database error:', error.message);
  console.log('');
});