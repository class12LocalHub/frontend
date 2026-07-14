<template>

  <section class="post-page">


    <div class="header-area">

      <h1>
        지역 게시판
      </h1>


      <RouterLink to="/posts/write">

        <button>
          글쓰기
        </button>

      </RouterLink>


    </div>



    <!-- 로딩 표시 -->

    <p v-if="loading">

      게시글을 불러오는 중입니다...

    </p>



    <!-- 게시글 목록 -->

    <div
      v-else
      class="post-list"
    >


      <div

        v-for="post in posts"

        :key="post.id"

        class="post-card"

        @click="goDetail(post.id)"

      >


        <h3>

          {{ post.title }}

        </h3>



        <span>

          {{ post.category }}

        </span>



        <p>

          {{ post.content }}

        </p>


      </div>


    </div>



    <!-- 데이터가 없을 때 -->

    <p v-if="!loading && posts.length === 0">

      게시글이 없습니다.

    </p>



  </section>


</template>



<script setup>

import { ref, onMounted } from 'vue'

import { useRouter } from 'vue-router'


import { getPosts } from '../api/posts'



const router = useRouter()



// 게시글 저장

const posts = ref([])



// 로딩 상태

const loading = ref(false)





// 게시글 가져오기

async function fetchPosts(){


  try {


    loading.value = true



    const response = await getPosts()



    posts.value = response.data



  }


  catch(error){


    console.error(
      '게시글 조회 실패',
      error
    )


  }


  finally{


    loading.value = false


  }


}




// 상세 페이지 이동

function goDetail(id){


  router.push(
    `/posts/${id}`
  )


}




// 화면이 열릴 때 실행

onMounted(()=>{


  fetchPosts()


})



</script>



<style scoped>


.post-page {

  padding:60px 40px;

}



.header-area {

  display:flex;

  justify-content:space-between;

  align-items:center;

}



button {

  padding:10px 20px;

  background:#2563eb;

  color:white;

  border:none;

  border-radius:8px;

  cursor:pointer;

}



.post-list {

  margin-top:40px;

  display:flex;

  flex-direction:column;

  gap:20px;

}



.post-card {

  padding:25px;

  border:1px solid #ddd;

  border-radius:12px;

  cursor:pointer;

}



.post-card:hover {

  background:#f8fafc;

}



.post-card span {

  color:#2563eb;

  font-size:14px;

}



</style>