<template>
  <section 
  id="home"
  class="home-section">

    <div class="hero">

      <h1>
        LocalHub
      </h1>

      <p>
        서울의 관광·문화·생활 정보를 한 곳에서 확인하세요.
      </p>

    </div>


    <div class="category-area">

      <h2>
        지역 정보 카테고리
      </h2>


      <div class="categories">

        <div class="category-card">
          관광지
        </div>


        <div class="category-card">
          레포츠
        </div>


        <div class="category-card">
          문화시설
        </div>


        <div class="category-card">
          쇼핑
        </div>


        <div class="category-card">
          숙박
        </div>


        <div class="category-card">
          여행코스
        </div>


        <div class="category-card">
          축제공연행사
        </div>

      </div>

    </div>


  </section>
</template>


<style scoped>

.home-section {

  padding: 80px 40px;

}


.hero {

  text-align:center;

  padding:80px 0;

}


.hero h1 {

  font-size:48px;

  margin-bottom:20px;

}


.hero p {

  font-size:20px;

}


.category-area {

  margin-top:60px;

}


.categories {

  display:flex;

  flex-wrap:wrap;

  gap:20px;

}


.category-card {

  width:160px;

  height:100px;


  display:flex;

  justify-content:center;

  align-items:center;


  background:#f1f5f9;

  border-radius:15px;


  font-size:18px;

  font-weight:bold;

}

</style>