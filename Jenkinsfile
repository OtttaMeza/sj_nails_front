pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
    }

    environment {
        IMAGE_NAME   = "ottameza/sjnails-front"
        IMAGE_TAG    = "${env.BUILD_NUMBER}"
        HETZNER_HOST = "91.107.216.60"
        HETZNER_USER = "root"
        DEPLOY_PATH  = "/opt/sj-nails-front"
    }

    stages {

        stage('Checkout') {
            steps {
                deleteDir()
                checkout scm
            }
        }

        stage('Build Image') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -t ${IMAGE_NAME}:latest ."
            }
        }

        stage('Push Image') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh """
                        echo "\$DOCKER_PASS" | docker login -u "\$DOCKER_USER" --password-stdin
                        docker push ${IMAGE_NAME}:${IMAGE_TAG}
                        docker push ${IMAGE_NAME}:latest
                    """
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'hetzner-ssh-key', keyFileVariable: 'SSH_KEY'),
                    string(credentialsId: 'jwt-secret-front', variable: 'JWT_SECRET')
                ]) {
                    sh """
                        ssh -i \$SSH_KEY -o StrictHostKeyChecking=no ${HETZNER_USER}@${HETZNER_HOST} \
                            "mkdir -p ${DEPLOY_PATH}"

                        scp -i \$SSH_KEY -o StrictHostKeyChecking=no \
                            docker-compose.prod.yml \
                            ${HETZNER_USER}@${HETZNER_HOST}:${DEPLOY_PATH}/

                        ssh -i \$SSH_KEY -o StrictHostKeyChecking=no ${HETZNER_USER}@${HETZNER_HOST} \
                            "docker pull ${IMAGE_NAME}:${IMAGE_TAG} && \
                             cd ${DEPLOY_PATH} && \
                             JWT_SECRET='\$JWT_SECRET' \
                             DOCKER_IMAGE=${IMAGE_NAME}:${IMAGE_TAG} \
                             docker compose -f docker-compose.prod.yml up -d"
                    """
                }
            }
        }

    }

    post {
        always {
            script {
                try {
                    sh "docker logout || true"
                    sh "docker rmi ${IMAGE_NAME}:${IMAGE_TAG} || true"
                } catch (Exception e) {
                    echo "Cleanup omitido (sin contexto de nodo): ${e.message}"
                }
            }
        }
        success {
            echo "Deploy exitoso: ${IMAGE_NAME}:${IMAGE_TAG}"
        }
        failure {
            echo "Deploy fallido — build #${BUILD_NUMBER}"
        }
    }
}
