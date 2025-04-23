# LINE Queue Booking System

## Project Overview
This project implements a **queue booking system** using the **LINE Official Account (OA)**. The system allows users to book a queue, and admins can manage and monitor the queue through the LINE Rich Menu interface. It is connected to a backend powered by **Node.js/Express** and uses **MongoDB** for data storage. Store Queue for all days. Booking and Manage queue of only **Today**.

## Features
- **User Side**: 
  - Book a queue via LINE chat.
  - View Queue
  - Cancel Queue
  - With Background checks

- **Admin Side**:
   admin login with passcode verification.
  - Manage queues (e.g., mark a queue as "in progress" or "served").
  - Assign staff members to specific queues.
  - Real-time updates to the queue status through LINE Flex Messages.

## Technologies Used
- **Frontend**: LINE Official Account Rich Menu
- **Backend**:
  - **Node.js** with **Express**
  - **MongoDB** for storing queue data and user interactions
  - **LINE Messaging API** for communication between the backend and LINE
- **Authentication**: Admin login system with passcode protection
- **Styling**: **LINE Flex Messages** for queue updates

## Deployment Note: Render.com

Welcome To Bangkok Bank's Queue System.

Since the backend for the system is deployed on **Render.com's Free Tier account**, please follow these initialization steps:

1. Send a message to the LINE bot.
2. Wait for **30-60 seconds** (Render.com is starting the server).
3. After waiting, you can now use the **Rich Menu** to book your queue.

## Installation

### 1. Clone the Repository:
```bash
git clone https://github.com/your-username/line-queue-booking-system.git
