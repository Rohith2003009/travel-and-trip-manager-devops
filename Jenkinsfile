pipeline {
    agent any

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

        stage('Docker Build') {
            steps {
                echo 'Building Docker image...'
                bat 'docker build -t travel-trip-manager:latest .'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying application...'
                bat 'docker compose down'
                bat 'docker compose up -d --build'
            }
        }

        stage('Verify') {
            steps {
                echo 'Checking application container...'
                bat 'docker compose ps'
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
    stage('Check Docker') {
    steps {
        bat 'docker --version'
        bat 'docker compose version'
    }
}
}