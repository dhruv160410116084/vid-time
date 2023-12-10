# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory to /app
WORKDIR .

# Copy package.json and package-lock.json to the working directory

# Install app dependencies
RUN npm install

# Copy the current directory contents into the container at /app
COPY . .

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define environment variable
ENV NODE_ENV=staging

# Run the application
CMD ["node", "./back-end/index.js"]