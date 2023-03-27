<script lang="ts">
import axios from "axios";

interface TrainStation {
  station: string;
  time: string;
}

interface Train {
  id: string;
  name: string;
}

interface TrainRoute {
  name: string;
  route: string;
  timetable: TrainStation[];
  train: Train;
}

export default {
  data() {
    return {
      clockRunning: false,
      currentTime: new Date("2023-03-27T09:00:00Z"),
      transitTrains: [] as any[],
      journeys: [] as any[],
      clockInterval: null as any,
      leftPosition: 0,
      routeLength: 0,
    };
  },
  computed: {
    isWideScreen() {
      return window.innerWidth >= 1024;
    },
    // trainsInTransit() {
    //   return this.transitTrains.filter((train) => {
    //     const journeyTime = train.startTime + 1;
    //     return (
    //       this.currentTime >= train.startTime && this.currentTime <= journeyTime
    //     );
    //   });
    // },
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
    startClock() {
      let time = this.currentTime.getTime();
      this.clockInterval = setInterval(() => {
        time += 0.5 * 60 * 1000;
        this.currentTime = new Date(time);
        if (new Date(this.currentTime).getUTCHours() === 11) {
          clearInterval(this.clockInterval);
        }
        this.updateTrainIconPosition();
      }, 500);
    },
    stopClock() {
      clearInterval(this.clockInterval);
    },
    getCurrentTime() {
      const currentTime = new Date(this.currentTime);
      const hours = currentTime.getUTCHours();
      const minutes = currentTime.getUTCMinutes();
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

      return `${hours}:${formattedMinutes} AM`;
    },
    getRouteLength(timetable: TrainStation[]): string {
      const startTime = new Date(timetable[0].time);
      const endTime = new Date(timetable[timetable.length - 1].time);
      const routeLength = (endTime.getTime() - startTime.getTime()) / 60000;
      const totalDistance = routeLength * 5 + "px";
      console.log(totalDistance);
      return totalDistance;
    },
    getStationDistance(station: TrainStation, prevStation?: TrainStation) {
      let timeDiff = 0;
      if (prevStation) {
        const diffMs =
          new Date(station.time).getTime() -
          new Date(prevStation.time).getTime();
        timeDiff = diffMs / 60000;
      }
      const distance = timeDiff * 5 + "px";
      console.log(distance);
      return distance;
    },
    formatTimetable(time: string) {
      const date = new Date(time);
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      const formattedHours = hours.toString().padStart(2, "0");
      const formattedMinutes = minutes.toString().padStart(2, "0");
      return `${formattedHours}:${formattedMinutes}`;
    },
    updateTrainIconPosition() {
      if (
        new Date(this.currentTime).getUTCHours() < 9 ||
        new Date(this.currentTime).getUTCHours() > 11
      ) {
        return;
      }
      let currentStation = null as any;
      for (const journey of this.journeys) {
        for (let i = 0; i < journey.timetable.length; i++) {
          const stationTime = new Date(journey.timetable[i].time);
          if (stationTime.getTime() === this.currentTime.getTime()) {
            currentStation = journey.timetable[i].station;
            console.log(currentStation);
          } else {
            currentStation = journey.timetable[0].station;
          }
        }

        if (currentStation !== null) {
          const currentStationIndex = journey.timetable.indexOf(
            journey.timetable.find(
              (station: TrainStation) => station.station === currentStation
            )
          );
          const currentStationTime = new Date(
            journey.timetable[currentStationIndex].time
          );
          const nextStationTime = new Date(
            journey.timetable[currentStationIndex + 1].time
          );

          const endTime = new Date(
            journey.timetable[journey.timetable.length - 1].time
          );

          const startTime = new Date(journey.timetable[0].time);
          const totalTime = endTime.getTime() - startTime.getTime();

          const elapsedTime = this.currentTime.getTime() - startTime.getTime();
          const progress = elapsedTime / totalTime;

          this.leftPosition = (progress * 100) / totalTime;
          console.log(this.leftPosition);
          console.log(this.currentTime);

          // update transitTrains

          if (
            this.currentTime.getTime() >= startTime.getTime() &&
            this.currentTime.getTime() <= endTime.getTime()
          ) {
            if (!this.transitTrains.includes(journey.train.name)) {
              this.transitTrains.push(journey.train.name);
            }
          } else {
            const index = this.transitTrains.indexOf(journey.train.name);
            if (index !== -1) {
              this.transitTrains.splice(index, 1);
            }
          }
        } else {
          this.leftPosition = 0;
        }
      }
    },

    getNextStation(journey: TrainRoute) {
      let nextStation;
      for (let i = 0; i < journey.timetable.length; i++) {
        const stationTime = new Date(journey.timetable[i].time);
        nextStation = journey.timetable[0].station;
        if (stationTime.getTime() > this.currentTime.getTime()) {
          // console.log(this.currentTime.getTime());
          // console.log(stationTime.getTime());
          nextStation = journey.timetable[i].station;
        }
      }
      return nextStation;
    },
  },
  mounted() {
    axios.get("http://localhost:3001/journeys").then((response) => {
      this.journeys = response.data;
      console.log(this.journeys);
    });
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
            <ul>
              <li v-for="(item, index) in journey.timetable" :key="index">
                <span style="color: transparent">{{ index }}</span>
                <img
                  class="station-icon"
                  src="./../assets/station.svg"
                  alt="Station Icon"
                />
              </li>
            </ul>
            <div
              class="train-line"
              :style="{ width: getRouteLength(journey.timetable) }"
            >
              <div
                class="train-icon"
                :style="{
                  left: leftPosition + '%',
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
              <li
                v-for="(item, index) in journey.timetable"
                :key="index"
                :style="{
                  marginRight: getStationDistance(
                    item,
                    journey.timetable[index - 1]
                  ),
                }"
              >
                {{ formatTimetable(item.time) }}
                <div class="dash"></div>
              </li>
            </ul>
          </td>
          <!-- <td>{{ getNextStation(journey) }}</td> -->
          <!-- <td v-if="isWideScreen">{{ journey.route }}</td>
          <td v-if="isWideScreen">{{ formatTimetable(journey.timetable) }}</td>
          <td v-if="isWideScreen">{{ getNextStation(journey) }}</td> -->
          <td>{{ getNextStation(journey) }}</td>
          <td>
            <div>{{ journey.train.name }}</div>
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
  width: 16px;
  height: 16px;
  margin: auto;
  padding: 1px;
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
  margin: 30px auto;
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

.timetable ul {
  text-orientation: sideways;
  writing-mode: vertical-rl;
  transform: rotate(-180deg);
  list-style: none;
  padding: 0.5rem;
}
.station-icon {
  width: 20px;
  height: 16px;
  position: absolute;
  bottom: 0;
}

.timetable ul li {
  display: flex;
}

.dash {
  width: 30px;
  position: absolute;
  bottom: 0;
  margin: 0;
  padding: 0;
  border-bottom: 1px solid black;
  rotate: 90deg;
  margin-bottom: -20px;
}
</style>
