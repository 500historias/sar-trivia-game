const questionElement = document.getElementById("question")
const answer1Element  = document.getElementById("answer1")
const answer2Element  = document.getElementById("answer2")
const answer3Element  = document.getElementById("answer3")
const answer4Element  = document.getElementById("answer4")
const submitAnswer = document.getElementById("trivia_game")
let queryParams = {};
let questionId;
let JsonObject;
let selectedAnswer;
let selectedAnswerSelected = '';
let answerConfirmation = {
  "Question_ID": 1,
  "Status": false
};

const start_server = parseQueryParams();

function clickOnAnswer(element) {
   // If there's a previously selected element, reset its background color
   if (selectedAnswer) {
    selectedAnswer.style.backgroundColor = ''; // Change '' to the original background color if necessary
  }
  element.style.backgroundColor = 'rgba(62, 80, 184, 0.973)';

  selectedAnswer = element;
  selectedAnswerSelected = selectedAnswer.querySelector('.AquiVaLaRespuesta').textContent
  // console.log('Selected answer: ' + selectedAnswerSelected);

  if(JsonObject[0].op_correct === selectedAnswerSelected){
    answerConfirmation.Status = true
    answerConfirmation.Question_ID = questionId
    console.log(answerConfirmation)
  }else{
    answerConfirmation.Status = false
    answerConfirmation.Question_ID = questionId
    console.log(answerConfirmation)
  }
}

function closeWebView(success){
    if(window.messageHandler) {
      window.messageHandler.postMessage(success);
      window.close();
    }
  }

submitAnswer.addEventListener("submit", (event) => {
  event.preventDefault()
  let responde = JSON.stringify(answerConfirmation)
  console.log("Sending info to back-end")
  if(user_Id_pre_If){
    fetch(`/answer?userId=${user_Id_pre_If}`, {
    method: 'Post',
    headers: {'Content-Type': 'application/json'},
    body: responde})
    .then( x => {
      closeWebView(answerConfirmation.Status)
    })
    .catch(error => console.log(error))
  }
})

answer1Element.onclick = function() { clickOnAnswer(answer1Element) };
answer2Element.onclick = function() { clickOnAnswer(answer2Element) };
answer3Element.onclick = function() { clickOnAnswer(answer3Element) };
answer4Element.onclick = function() { clickOnAnswer(answer4Element) };

function assignData(data) {
  JsonObject = data;
  questionId = JsonObject[0].q_id
  let questionText = JsonObject[0].text;
  let answerArray = [
    JsonObject[0].op_correct,
    JsonObject[0].op2,
    JsonObject[0].op3,
    JsonObject[0].op4
  ]
    // Shuffle the answers
  for (let i = answerArray.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [answerArray[i], answerArray[j]] = [answerArray[j], answerArray[i]];}
  
  questionElement.textContent = questionText;
  answer1Element.textContent = answerArray[0];
  answer2Element.textContent = answerArray[1];
  answer3Element.textContent = answerArray[2];
  answer4Element.textContent = answerArray[3];

  // Additional code to check the updated elements
  console.log("Question: " + questionElement.textContent);
  console.log("Answer 1: " + answer1Element.textContent);
  console.log("Answer 2: " + answer2Element.textContent);
  console.log("Answer 3: " + answer3Element.textContent);
  console.log("Answer 4: " + answer4Element.textContent);
}

let user_Id_pre_If = queryParams['userId']

if(user_Id_pre_If){
  fetch(`/question?userId=${user_Id_pre_If}`)
    .then(response => response.json())
    .then(data => {
      // Access and display the received JSON data
      console.log(data);
      assignData(data);
    })
    .catch(error => {
      console.log('Error:', error);
    });
}else{
  console.log('No se tiene userId')
}

// fetch(`/question`)
//     .then(response => response.json())
//     .then(data => {
//       // Access and display the received JSON data
//       assignData(data);
//       questionId = data[0].q_id
//     })
//     .catch(error => {
//       console.log('Error:', error);
//     });


function parseQueryParams(){
  const searchParams = new URLSearchParams(window.location.search);
  return new Promise((resolve, reject) => {
  
  for (const [key, value] of searchParams) {
      queryParams[encodeURIComponent(key)] = encodeURIComponent(value);
    }})
  }
