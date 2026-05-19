# Use the official Bun image
FROM oven/bun:1

WORKDIR /app

# Copy all your code into the cloud server
COPY . .

# Move into the backend folder and install dependencies
RUN cd apps/backend && bun install

# Set the working directory to the backend
WORKDIR /app/apps/backend

# Build the NestJS project
RUN bun run build

# Tell AWS we are using port 3000
EXPOSE 3000

# Start the server
CMD ["bun", "run", "start:prod"]
