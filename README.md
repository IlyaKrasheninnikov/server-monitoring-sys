# Server Monitoring System  

This project is a scalable microservices-based solution for monitoring the health and performance of servers and popular web applications. It provides real-time metrics collection and visualization using modern technologies.  

## Project Goals  
1. Build an efficient monitoring system for tracking the state of servers and services.  
2. Enable scalability through microservices architecture.  
3. Develop dashboards for visualizing server and application metrics.  
4. Automate deployment and maintenance processes using Docker.  

## Features  
- **Real-time monitoring** with Prometheus and Grafana dashboards.  
- **Backend services** built with FastAPI for data collection and processing.  
- **Microservices architecture** to ensure scalability and modularity.  
- **Automation** of deployment and CI/CD pipelines using GitHub Actions and Docker.  
- **Cross-platform UI** developed using React for user-friendly metric visualization.  

## Tech Stack  
- **Backend:** FastAPI  
- **Frontend:** Reactjs
- **DevOps:** Docker, Docker Compose  
- **Monitoring:** Prometheus, Grafana  
- **Database:** MongoDB  
- **CI/CD:** GitHub Actions  

## Getting Started  

### Prerequisites  
- Node.js and npm.  

### Installation  
1. Clone the repository:

   ```bash  
   git clone https://github.com/IlyaKrasheninnikov/server-monitoring-sys.git  
   cd server-monitoring-sys
   ```
   
2. Set up backend and run, using uvicorn:
  
    ```bash
    cd backend
    pip install -r requirements.txt
    uvicorn app:app --host 0.0.0.0 --port 8000 --reload
    ```

3. Set up frontend with ReactJS:

   ```bash
    cd frontend
    npm install
    npm start
    ```

4. Access frontend:

   Open http://localhost:3000 in your browser.

## Demo

![First demo](https://github.com/user-attachments/assets/2ae2774b-d91c-4a1e-a496-daa47c24d17c)
