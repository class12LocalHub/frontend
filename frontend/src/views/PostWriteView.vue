<template>

  <section class="write-page">


    <h1>
      게시글 작성
    </h1>



    <div class="form">


      <label>
        제목
      </label>

      <input
        v-model="post.title"
        placeholder="제목을 입력하세요"
      />



      <label>
        카테고리
      </label>


      <select
        v-model="post.category"
      >

        <option>
          관광지
        </option>

        <option>
          레포츠
        </option>

        <option>
          문화시설
        </option>

        <option>
          쇼핑
        </option>

        <option>
          숙박
        </option>

        <option>
          여행코스
        </option>

        <option>
          축제공연행사
        </option>

        <option>
          음식점
        </option>


      </select>




      <label>
        내용
      </label>


      <textarea

        v-model="post.content"

        placeholder="내용을 입력하세요"

      ></textarea>




      <label>
        태그
      </label>


      <input

        v-model="post.tags"

        placeholder="예) 서울, 맛집, 여행"

      />




      <label>
        수정/삭제 비밀번호
      </label>


      <input

        type="password"

        v-model="post.password"

        placeholder="비밀번호"

      />




      <button
        @click="submitPost"
      >

        등록

      </button>


    </div>



  </section>


</template>




<script setup>

import { reactive } from 'vue'

import { useRouter } from 'vue-router'



const router = useRouter()



const post = reactive({

  title:'',

  category:'관광지',

  content:'',

  tags:'',

  password:''

})





function submitPost(){


  if(
    !post.title ||
    !post.content ||
    !post.password
  ){

    alert('필수 항목을 입력해주세요.')

    return

  }



  console.log(post)



  alert('게시글 작성 완료')



  router.push('/posts')


}


</script>




<style scoped>


.write-page {

  padding:60px 40px;

}



.form {

  max-width:700px;

  display:flex;

  flex-direction:column;

  gap:12px;

}



label {

  margin-top:15px;

  font-weight:bold;

}



input,
select,
textarea {

  padding:12px;

  font-size:16px;

}



textarea {

  height:200px;

  resize:none;

}



button {

  margin-top:20px;

  padding:12px;

  background:#2563eb;

  color:white;

  border:none;

  border-radius:8px;

  cursor:pointer;

}



</style>