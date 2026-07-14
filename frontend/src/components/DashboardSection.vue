<template>
  <section
  id="dashboard"
  class="dashboard-section">

    <h2>
      데이터 대시보드
    </h2>


    <div class="dashboard-container">


      <div class="stat-card">

        <h3>
          관광지
        </h3>

        <p>
          120개
        </p>

      </div>



      <div class="stat-card">

        <h3>
          축제공연행사
        </h3>

        <p>
          35개
        </p>

      </div>



      <div class="stat-card">

        <h3>
          게시글
        </h3>

        <p>
          24개
        </p>

      </div>


    </div>



    <div class="chart-box">

      <h3>
        카테고리별 지역 정보 현황
      </h3>


      <div class="fake-chart">

        관광지 ██████████

        <br>

        레포츠 ██████

        <br>

        문화시설 ████████

        <br>

        쇼핑 ████

        <br>

        숙박 █████

        <br>

        여행코스 ███████

        <br>

        축제공연행사 ████

      </div>


    </div>


  </section>
</template>



<style scoped>

.dashboard-section {

  padding:80px 40px;

}



.dashboard-section h2 {

  font-size:32px;

  margin-bottom:40px;

}



.dashboard-container {

  display:flex;

  gap:20px;

  flex-wrap:wrap;

}



.stat-card {

  width:200px;

  padding:25px;

  border-radius:12px;

  background:#f1f5f9;

  text-align:center;

}



.stat-card h3 {

  margin-bottom:20px;

}



.stat-card p {

  font-size:32px;

  font-weight:bold;

}



.chart-box {

  margin-top:50px;

  padding:30px;

  border:1px solid #ddd;

  border-radius:12px;

}



.fake-chart {

  line-height:2.2;

  margin-top:20px;

}



</style>