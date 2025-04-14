# Air Race Game Design Document

## Game Title

Air Race Challenge

## Game Overview

Air Race Challenge is a time-trial flight game where the player pilots a Spitfire MK1-style airplane in third-person (external) view. The goal is to navigate through 8 randomly placed orange tube obstacles and finish the course by flying under a bridge. The player must avoid missing gates and crashing to achieve the best time. A leaderboard tracks the fastest times.

## Platform

Desktop (Web only) 

## Controls

- **Arrow Up**: Ascend
- **Arrow Down**: Descend
- **Arrow Left**: Turn Left
- **Arrow Right**: Turn Right

## Game Rules

- **Obstacles**: 8 orange tube gates scattered randomly in 3D space.
  - Minimum 300-pixel radius distance between each obstacle.
- **Finish Line**: Fly under a bridge.
- **Penalty**: +10 seconds for each missed gate.
- **Game Ends When**:
  - The airplane finishes the course (flies under the bridge), OR
  - Crashes into the ground, OR
  - Crashes into the bridge.

## Game Objective

Complete the obstacle course in the shortest possible time.

## Player Setup

- Player enters a username before the game starts.

## Scoring System

- Base time from start to finish line.
- +10 seconds added for each missed gate.
- Final time is recorded on the leaderboard.

## Leaderboard

- Stores username and final score (completion time).
- Sorted in ascending order (best times at top).

## Visual Design

- **Plane Model**: Stylized Spitfire MK1 in third-person view.
- **Obstacles**: Bright orange tubes.
- **Environment**: Sky background, a bridge like Lanchid (or chain-bridge) in Budapest at finish line, terrain (ground surface).
- Add visual feedback for penalties (e.g. red flash or text).
- Include a minimap or waypoint arrows for navigation.
- Timer UI at the top right corner.
- Pause/Restart options at the right bottom corner of the screen.
- Camera shake effect on crash.

## Audio Design

- Background engine sound.
- Whoosh sound when passing through gates.
- Crash sound effects.
- Applause or fanfare when completing the course.

---

*End of Game Design Document*
