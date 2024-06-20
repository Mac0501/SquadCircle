# About The Project
SquadCircle is a self-hosted group manager, designed for creating events and votes to decide and manage group activities. The app features a responsive frontend built with React, ensuring a seamless user experience for everyone. Easily create events and polls to gather group opinions, or manage ongoing activities with the intuitive UI.

## Key Features
- Event Creation: Effortlessly create and manage events for your group activities.
- Voting System: Set up polls to gather opinions and make group decisions.
- User-Friendly Interface: Intuitive and responsive UI built with React for a seamless experience.
- API Integration: Interact with third-party applications through a robust API.
- Real-Time Updates: Keep your group informed with real-time notifications and updates.
- Customizable Settings: Tailor the app to meet your group's specific needs and preferences.
- Secure Data Management: Ensure your group's data is safe with secure backend processing in Python.

## Deploy with Docker in seconds

```bash
docker run -d \
    --name=SquadCircle \
    -p 9050:3000 \
    -e url="your.own.domain" \
    -v squadcircle-data:/app/resources \
    --restart unless-stopped \
    mac0501/squadcircle:latest
```

## Build It Yourself

Follow these steps to build and self-host the Docker image for SquadCircle:

1. Clone the Repository:

```bash
git clone https://github.com/Mac0501/SquadCircle.git
cd squadcircle
```

2. Build the Docker Image:
Make sure you have Docker installed on your system. Then, build the Docker image using the following command:

```bash
docker build -t squadcircle .
```

3. Run the Docker Container:

After the image is built, run the Docker container:
```bash
docker run -d \
    --name=SquadCircle \
    -p 9050:3000 \
    -e url="your.own.domain" \
    -v squadcircle-data:/app/resources \
    --restart unless-stopped \
    squadcircle
```
4. Access the Application:
Open your web browser and go to http://your.own.domain to start using SquadCircle.

## Running the Project in a Development Environment
This guide will help you set up and run the project in a development environment. Follow these steps to get started:

1. Start the Project in a Development Container
To begin, initiate the project within a development container. This environment is designed to isolate and manage the project's dependencies.

2. Install Dependencies
Navigate to the project's root directory and run the following command to install the necessary dependencies: `npm install`

3. Start the Client
Once the dependencies are installed, start the client application by running: `npm run start`This command will launch the client interface in development mode.

4. Launch in Debugging Mode
Finally, to run the backend service, execute launcher.py in debugging mode. This allows you to track and debug the application's behavior in real-time. 

By following these steps, you will have successfully set up and run the project in a development environment. Happy coding!