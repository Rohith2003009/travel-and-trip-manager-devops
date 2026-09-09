pipeline {
    agent any

    environment {
        DOCKER_EXE = 'C:\\Users\\rohith\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\docker.exe'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out code from GitHub...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing dependencies...'
                bat 'npm ci'
            }
        }

        stage('Build Application') {
            steps {
                echo 'Building application...'
                bat 'npm run build'
            }
        }

        stage('Check Docker') {
            steps {
                echo 'Checking Docker installation...'
                bat '"%DOCKER_EXE%" --version'
                bat '"%DOCKER_EXE%" compose version'
            }
        }

        stage('Docker Build') {
            steps {
                echo 'Building Docker image...'
                bat '"%DOCKER_EXE%" build -t travel-trip-manager:latest .'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying application...'
                bat '"%DOCKER_EXE%" compose down'
                bat '"%DOCKER_EXE%" compose up -d --build'
            }
        }

        stage('Verify') {
            steps {
                echo 'Checking running containers...'
                bat '"%DOCKER_EXE%" compose ps'
            }
        }
    }

    post {
        success {
            echo 'CI/CD Pipeline completed successfully!'
        }

        failure {
            echo 'CI/CD Pipeline failed!'
        }
    }
}