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
      currentTime: new Date("2020-06-04T09:00:00Z").getTime(),
      transitTrains: [] as any[],
      journeys: [] as any[],
      clockInterval: null as any,
      leftPosition: 0,
      screenWidth: window.innerWidth,
      trainPosition: 0,
      nextStation: "" as string,
    };
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
      this.transitTrains = this.journeys.map(
        (item: TrainRoute) => item.train.name
      );
      this.clockInterval = setInterval(() => {
        this.trainPosition += 5;
        this.currentTime += 60 * 1000;
        for (let i = 0; i < this.journeys.length; i++) {
          // if (this.routeLengths[i] <= this.trainPosition) {
          //   this.transitTrains = this.transitTrains.filter(
          //     (train: Train) => train !== this.journeys[i].train.name
          //   );
          // }
          if (
            this.currentTime >
            new Date(
              this.journeys[i].timetable[
                this.journeys[i].timetable.length - 1
              ].time
            ).getTime()
          ) {
            this.transitTrains = this.transitTrains.filter(
              (train: Train) => train !== this.journeys[i].train.name
            );
          }
        }
        if (new Date(this.currentTime).getUTCHours() === 11) {
          clearInterval(this.clockInterval);
        }
        if (this.trainPosition > 120 * 5) this.stopClock();
      }, 500);
    },
    stopClock() {
      clearInterval(this.clockInterval);
    },
    getNextStation(journey: TrainRoute) {
      if (this.currentTime <= new Date(journey.timetable[0].time).getTime()) {
        return journey.timetable[0].station;
      } else {
        const nextStation = journey.timetable.find(
          (station: TrainStation) =>
            new Date(station.time).getTime() > this.currentTime
        );
        return nextStation?.station;
      }
    },
    getCurrentTime() {
      const currentTime = new Date(this.currentTime);
      const hours = currentTime.getUTCHours();
      const minutes = currentTime.getUTCMinutes();
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

      return `${hours}:${formattedMinutes} AM`;
    },
    getRouteLength(timetable: TrainStation[]): number {
      const startTime = new Date(timetable[0].time);
      const endTime = new Date(timetable[timetable.length - 1].time);
      const routeLength = (endTime.getTime() - startTime.getTime()) / 60000;
      return routeLength * 5;
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
    handleResize() {
      this.screenWidth = window.innerWidth;
    },
  },
  mounted() {
    axios.get("http://localhost:3001/journeys").then((response) => {
      this.journeys = response.data;
      console.log(this.journeys);
    });

    window.addEventListener("resize", this.handleResize);
    this.handleResize();
  },
  beforeDestroy() {
    clearInterval(this.clockInterval);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.handleResize);
  },
};
</script>

<template>
  <div class="app">
    <div class="header">
      <div class="left-side">
        <h2>Jiminny Trainspotting</h2>
        <button v-if="screenWidth > 1024" @click="toggleClock">
          {{ clockRunning ? "Stop" : "Start" }}
        </button>
      </div>
      <div class="right-side">
        <div v-if="screenWidth > 1024" class="trains">
          Trains in Transit: {{ transitTrains.join(", ") || "None" }}
        </div>
        <div v-if="screenWidth > 1024" class="time">
          Current Time: {{ getCurrentTime() }}
        </div>
      </div>
    </div>
    <table class="journeys">
      <thead>
        <tr>
          <th v-if="screenWidth > 1024 && screenWidth < 1299">Name/Route</th>
          <th v-if="screenWidth >= 1300 || screenWidth < 1024">Name</th>
          <th v-if="screenWidth >= 1300 || screenWidth < 1024">Route</th>
          <th>Timetable</th>
          <th v-if="screenWidth >= 1024">Next Station</th>
          <th>Train Name</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(journey, index) in journeys" :key="index">
          <td v-if="screenWidth > 1024 && screenWidth < 1299">
            {{ journey.name }} / {{ journey.route }}
          </td>
          <td v-if="screenWidth >= 1300 || screenWidth < 1024">
            {{ journey.name }}
          </td>
          <td v-if="screenWidth >= 1300 || screenWidth < 1024">
            {{ journey.route }}
          </td>
          <td v-if="screenWidth >= 1024">
            <div class="timetable">
              <div
                v-for="(item, index) in journey.timetable"
                :key="index"
                :style="{
                  marginLeft: getStationDistance(
                    item,
                    journey.timetable[index - 1]
                  ),
                }"
              >
                <img
                  class="station-icon"
                  src="./../assets/station.svg"
                  alt="Station Icon"
                />
                <div class="dash"></div>
                <div class="times">{{ formatTimetable(item.time) }}</div>
              </div>
            </div>
            <div
              class="train-line"
              :style="{
                width: getRouteLength(journey.timetable) + 'px',
              }"
            >
              <img
                :style="{
                  marginLeft: trainPosition + 'px',
                }"
                class="train"
                src="./../assets/train.svg"
                alt="Train Icon"
              />
            </div>
          </td>
          <td v-if="screenWidth < 1024">
            <ul style="list-style: none">
              <li v-for="(item, index) in journey.timetable" :key="index">
                {{ formatTimetable(item.time) }}: {{ item.station }}
              </li>
            </ul>
          </td>

          <td v-if="screenWidth >= 1024">{{ getNextStation(journey) }}</td>
          <td>
            <div>{{ journey.train.name }}</div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
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

.left-side h2 {
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

.station-icon {
  width: 20px;
  height: 16px;
}

.timetable {
  display: flex;
}

.dash {
  height: 25px;
  margin-left: 0.5rem;
  position: relative;
  border-left: 1px solid #000;
}

.train {
  position: relative;
  width: 16px;
  height: 16px;
  padding: 1px;
  border-radius: 50%;
  background-color: #fff;
}

.times {
  margin-top: 0.2rem;
  text-orientation: sideways;
  writing-mode: vertical-rl;
  transform: rotate(-180deg);
}

.train-line {
  height: 25px;
  background: url("./../assets/road-texture.jpg");
  background-size: contain;
  margin: -4.5rem 0 3.5rem;
}
</style>
