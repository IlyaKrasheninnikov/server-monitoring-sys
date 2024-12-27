# Server Monitoring System  

This project is a scalable microservices-based solution for monitoring the health and performance of servers and popular web applications. It provides real-time metrics collection and visualization using modern technologies.  

## Features  
- **Real-time website monitoring**
- **Response time tracking**
- **Outage detection and reporting**
- **Historical data visualization**
- **REST API endpoints**
- **Modern React dashboard**
- **MongoDB integration**

## Tech Stack  
- **Backend:** FastAPI  
- **Frontend:** Reactjs
- **DevOps:** Docker, Docker Compose  
- **Monitoring:** APScheduler  
- **Database:** MongoDB  

## Getting Started  

### Prerequisites  
- Docker.  

### Installation  
1. Clone the repository:

   ```bash  
   git clone https://github.com/IlyaKrasheninnikov/server-monitoring-sys.git  
   cd server-monitoring-sys
   ```
   
2. Set up backend, frontend and mongodb containers using docker:
  
    ```bash
    docker compose up
    ```

4. Access frontend:

   Open http://localhost:3000/ in your browser.


### API Endpoints

- ```GET /monitor/status/{url}``` - Get website status detailed information
- ```POST /monitor/report/{url}``` - Report website issue
- ```GET /monitor/outage-history/{url}``` - Get outage history
- ```GET /monitor/last-reported``` - Get recently reported websites
- ```GET /monitor/latest-checked``` - Get recently checked websites
- ```GET /monitor/down-now```- Get websites, which are currently unavailable
- ```GET /health``` - Service health check

## Demo screenshots

![Demo](https://github.com/user-attachments/assets/8df13c2a-6b4d-4ccb-8396-ffb4bc255126)
![Demo](https://github.com/user-attachments/assets/21124bbe-43e6-4f46-881d-b8f4820c2f52)
![Demo](https://github.com/user-attachments/assets/2927cb5a-a083-4603-a340-168042db30d4)
![Demo](https://github.com/user-attachments/assets/a0b8d2f0-efd2-41c2-8d22-dd60742cc1e7)
![Demo](https://github.com/user-attachments/assets/94632a2a-642f-473d-b15c-df0aec06762d)
