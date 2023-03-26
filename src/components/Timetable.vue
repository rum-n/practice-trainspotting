<script lang="ts">
import axios from "axios";

export default {
  data() {
    return {
      clockRunning: false,
      currentTime: null as any,
      transitTrains: [] as any[],
      journeys: [] as any[],
      clockInterval: null as any,
      leftPosition: 0,
      rightPosition: 100,
    };
  },
  computed: {
    isWideScreen() {
      return window.innerWidth >= 1024;
    },
    trainsInTransit() {
      return this.transitTrains.filter((train) => {
        const journeyTime = train.startTime + 1; // 1 minute journey time
        return (
          this.currentTime >= train.startTime && this.currentTime <= journeyTime
        );
      });
    },
  },
  methods: {
    toggleClock() {
      this.clockRunning = !this.clockRunning;
      if (this.clockRunning) {
        this.startClock();
      } else {
        this.stopClock();
      }
    },
    // startClock() {
    //   this.updateClock();
    //   this.clockInterval = setInterval(this.updateClock, 500);
    // },
    startClock() {
      const startTime = new Date();
      startTime.setHours(9);
      startTime.setMinutes(0);
      startTime.setSeconds(0);
      startTime.setMilliseconds(0);
      this.currentTime = startTime.getTime();

      this.clockInterval = setInterval(() => {
        this.currentTime += 0.5 * 60 * 1000;
        if (new Date(this.currentTime).getHours() === 11) {
          clearInterval(this.clockInterval);
        }
      }, 500);
    },
    stopClock() {
      clearInterval(this.clockInterval);
    },
    getCurrentTime() {
      const currentTime = new Date(this.currentTime);
      const hours = currentTime.getHours();
      const minutes = currentTime.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";

      const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

      return `${formattedHours}:${formattedMinutes} ${ampm}`;
    },
    // updateClock() {
    //   this.currentTime = new Date();
    //   this.updateTransitTrains();
    //   this.updateTrainPositions();
    // },
    updateTransitTrains() {
      const currentTimeStr = this.currentTime;
      this.transitTrains = this.journeys
        .filter((journey) => {
          return (
            journey.timetable.includes(currentTimeStr) &&
            journey.position < journey.routeLength
          );
        })
        .map((journey) => journey.name);
    },
    // updateTrainPositions() {
    //   this.journeys.forEach((journey) => {
    //     const timeDiff = this.getTimeDiff(journey.startTime, this.currentTime);
    //     const position = timeDiff / 2;
    //     journey.position = position;
    //   });
    // },
    // formatTime(date: Date) {
    //   return date?.toLocaleTimeString("en-US", {
    //     hour12: false,
    //     hour: "2-digit",
    //     minute: "2-digit",
    //   });
    // },
    formatTimetable(time: string) {
      const date = new Date(time);
      const hours = date.getUTCHours();
      const minutes = date.getMinutes();
      const formattedHours = hours.toString().padStart(2, "0");
      const formattedMinutes = minutes.toString().padStart(2, "0");
      return `${formattedHours}:${formattedMinutes}`;
    },
    // getNextStation(journey: any) {
    //   const timeDiff = this.getTimeDiff(journey.startTime, this.currentTime);
    //   const nextStationIndex = Math.floor(timeDiff / 2);
    //   return journey.route[nextStationIndex];
    // },
    // getTimeDiff(startTime: any, endTime: any) {
    //   const start = startTime?.getTime();
    //   const end = endTime?.getTime();
    //   return (end - start) / 1000;
    // },
    updateTrainIconPosition() {
      // Find the current station based on the current time
      // const currentTime = new Date();
      let currentStation = null;
      for (const journey of this.journeys) {
        for (let i = 0; i < journey.timetable.length; i++) {
          const stationTime = new Date(journey.timetable[i].time);
          if (stationTime.getTime() > this.currentTime.getTime()) {
            currentStation = i - 1;
            break;
          }
        }

        if (currentStation !== null) {
          const stationTime = new Date(journey.timetable[currentStation].time);
          const nextStationTime = new Date(
            journey.timetable[currentStation + 1].time
          );
          const totalTime = nextStationTime.getTime() - stationTime.getTime();
          const elapsedTime =
            this.currentTime.getTime() - stationTime.getTime();
          const progress = elapsedTime / totalTime;
          this.leftPosition = progress * 100;
          this.rightPosition = 100 - this.leftPosition;
        } else {
          this.leftPosition = 0;
          this.rightPosition = 0;
        }
      }
    },
  },
  mounted() {
    axios.get("http://localhost:3001/journeys").then((response) => {
      this.journeys = response.data;
      console.log(this.journeys);
    });

    this.updateTrainIconPosition();
    setInterval(() => {
      this.updateTrainIconPosition();
    }, 500);

    // this.updateViewportWidth();
    // window.addEventListener("resize", this.updateViewportWidth);
  },
  beforeDestroy() {
    clearInterval(this.clockInterval);
  },
};
</script>

<template>
  <div class="app">
    <div class="header">
      <div class="left-side">
        <h1>Jiminny Trainspotting</h1>
        <button @click="toggleClock">
          {{ clockRunning ? "Stop" : "Start" }}
        </button>
      </div>
      <div class="right-side">
        <div class="trains">
          Trains in Transit: {{ transitTrains.join(", ") || "None" }}
        </div>
        <div class="time">Current Time: {{ getCurrentTime() }}</div>
      </div>
    </div>
    <table class="journeys">
      <thead>
        <tr>
          <th>Name</th>
          <!-- <th v-if="isWideScreen">Route</th>
          <th v-if="isWideScreen">Timetable</th>
          <th v-if="isWideScreen">Next Station</th> -->
          <th>Route</th>
          <th>Timetable</th>
          <th>Next Station</th>
          <th>Train Name</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(journey, index) in journeys" :key="index">
          <td>{{ journey.name }}</td>
          <td>{{ journey.route }}</td>
          <td class="timetable">
            <div class="train-line">
              <div
                class="train-icon"
                :style="{
                  left: leftPosition + '%',
                  right: rightPosition + '%',
                }"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  version="1.1"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  viewBox="0 0 500 500"
                >
                  <g stroke="none" fill="black">
                    <circle cx="226" cy="19" r="19" />
                    <circle cx="275" cy="19" r="19" />
                    <rect
                      x="100"
                      y="44"
                      rx="65"
                      ry="65"
                      width="300"
                      height="370"
                    />
                    <g fill="white">
                      <rect
                        x="207"
                        y="58"
                        rx="11"
                        ry="11"
                        width="87"
                        height="41"
                      />
                      <rect
                        x="136"
                        y="112"
                        rx="34"
                        ry="34"
                        width="229"
                        height="111"
                      />
                      <circle cx="166" cy="349" r="30" />
                      <circle cx="334" cy="349" r="30" />
                    </g>
                  </g>
                  <polyline
                    points="96,530 162,432 338,432 404,530"
                    stroke="black"
                    stroke-width="2"
                    fill="none"
                  />
                </svg>
              </div>
            </div>
            <ul>
              <li v-for="(item, index) in journey.timetable" :key="index">
                {{ formatTimetable(item.time) }}
              </li>
            </ul>
          </td>
          <!-- <td>{{ getNextStation(journey) }}</td> -->
          <!-- <td v-if="isWideScreen">{{ journey.route }}</td>
          <td v-if="isWideScreen">{{ formatTimetable(journey.timetable) }}</td>
          <td v-if="isWideScreen">{{ getNextStation(journey) }}</td> -->
          <td>
            <div class="train" :style="{ left: journey.position + 'px' }">
              <div class="train-icon">{{ journey.trainName }}</div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.train-line {
  position: relative;
  height: 25px;
  background: url("./../assets/road-texture.jpg");
  background-size: 50% 50%;
  margin-bottom: 0.5rem;
}

.train-icon {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 20px;
  height: 20px;
  margin: auto;
  background-color: #fff;
  border-radius: 50%;
}

.train-station {
  position: absolute;
  bottom: -10px;
  transform: translateX(-50%);
}
.app {
  max-width: 90%;
  margin: 0 auto;
  padding: 20px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.left-side {
  display: flex;
  align-items: center;
}

.left-side h1 {
  margin-right: 20px;
}

.track {
  width: 100%;
  height: 1px;
  background: url("./assets/road-texture.jpg") repeat-x;
}

.right-side {
  display: flex;
  align-items: center;
}

.right-side .trains {
  margin-right: 20px;
}

.journeys {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #ddd;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
}

.journeys th {
  background-color: #f1307a;
  color: #fff;
  text-align: left;
}

.journeys th,
.journeys td {
  padding: 5px 10px;
}

.journeys tr:nth-child(even) {
  background-color: #eee;
}
/* 
.timetable {
} */
.timetable ul {
  text-orientation: sideways;
  writing-mode: vertical-rl;
  transform: rotate(-180deg);
  list-style: none;
}
</style>
