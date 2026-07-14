<template>

  <section class="detail-page">


    <div class="post-container">


      <h1>
        {{ post.title }}
      </h1>


      <div class="info">


        <span>
          카테고리: {{ post.category }}
        </span>


        <span>
          조회수: {{ post.views }}
        </span>


        <span>
          {{ post.date }}
        </span>


      </div>



      <hr>



      <p class="content">

        {{ post.content }}

      </p>



      <div class="buttons">


        <button
          @click="showPassword = true"
        >

          수정

        </button>



        <button
          @click="showPassword = true"
        >

          삭제

        </button>


      </div>



      <!-- 비밀번호 확인 -->

      <div
        v-if="showPassword"
        class="password-box"
      >

        <h3>
          비밀번호 확인
        </h3>


        <input

          type="password"

          v-model="password"

          placeholder="비밀번호"

        />



        <button
          @click="checkPassword"
        >

          확인

        </button>



      </div>


    </div>


  </section>


</template>




<script setup>

import { ref } from 'vue'

import { useRoute } from 'vue-router'

import { useRouter } from 'vue-router'



const route = useRoute()

const router = useRouter()



// 나중에는 API에서 가져올 데이터

const post = ref({

  id: route.params.id,

  title:'서울숲 방문 후기',

  category:'관광지',

  content:'서울숲에 다녀온 후기입니다. 산책하기 좋은 장소입니다.',

  views:15,

  date:'2026-07-14'

})



const showPassword = ref(false)


const password = ref('')





function checkPassword(){


  // 현재는 테스트용

  if(password.value === '1234'){


    alert('비밀번호 확인 완료')


    // 나중에는 수정/삭제 API 연결



  }

  else{


    alert('비밀번호가 틀렸습니다.')


  }


}


</script>




<style scoped>


.detail-page {

  padding:60px 40px;

}



.post-container {

  max-width:800px;

  margin:auto;

}



.info {

  display:flex;

  gap:20px;

  color:#666;

  margin-top:20px;

}



.content {

  min-height:200px;

  margin-top:40px;

  line-height:1.7;

}



.buttons {

  margin-top:40px;

}



button {

  padding:10px 20px;

  margin-right:10px;

  border:none;

  border-radius:8px;

  background:#2563eb;

  color:white;

  cursor:pointer;

}



.password-box {

  margin-top:30px;

  padding:20px;

  border:1px solid #ddd;

  border-radius:10px;

}



.password-box input {

  padding:10px;

  margin-right:10px;

}



</style>