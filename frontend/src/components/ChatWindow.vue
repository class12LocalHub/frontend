<template>
  <div class="chat-window">

    <div class="chat-header">
      <h3>
        LocalHub AI
      </h3>

      <button>
        ✕
      </button>
    </div>


    <div class="chat-body">

      <div class="message bot">
        안녕하세요. 서울 지역 정보를 알려드릴게요.
      </div>


      <div class="message user">
        서울 축제 알려줘
      </div>


      <div class="message bot">
        서울에는 다양한 축제가 있습니다.
      </div>

    </div>


    <div class="chat-input">

      <input
        placeholder="질문을 입력하세요"
      />


      <button>
        전송
      </button>

    </div>


  </div>
</template>



<style scoped>

.chat-window {

  position:fixed;

  right:30px;

  bottom:100px;


  width:350px;

  height:500px;


  background:white;

  border-radius:15px;


  box-shadow:0 5px 20px rgba(0,0,0,0.2);


  display:flex;

  flex-direction:column;

}



.chat-header {

  padding:15px;


  display:flex;

  justify-content:space-between;


  border-bottom:1px solid #ddd;

}



.chat-header button {

  border:none;

  background:none;

  cursor:pointer;

}



.chat-body {

  flex:1;

  padding:20px;

  overflow:auto;

}



.message {

  padding:10px;

  border-radius:10px;

  margin-bottom:10px;

  max-width:80%;

}



.bot {

  background:#f1f5f9;

}



.user {

  background:#2563eb;

  color:white;

  margin-left:auto;

}



.chat-input {

  display:flex;

  padding:10px;

  border-top:1px solid #ddd;

}



.chat-input input {

  flex:1;

  padding:10px;

}



.chat-input button {

  padding:10px;

}

</style>