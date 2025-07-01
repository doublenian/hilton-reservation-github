```
Business background
Hilton Restaurants want to create an online table reservation system to allow guests to reserve tables. Guests will make a reservation with their personal contact info, and the restaurant employees will browse and manage those reservations. 
```

# Requirements
## Data structure
    - Guest Name
    - Guest contact Info (phone, email address)
    - Expected arrival time
    - Table size
    - Status of the reservation: Requested, Approved, Cancelled, Completed
- Guests should be able to make reservations. 
- Guests should be able to update their reservations.
- Guests should be able to cancel their reservations.


- Restaurant employees should be able to update reservations to Approved, Cancelled, Completed.
- Restaurant employees should be able to browse all the reservations by date and status.
- Restaurant employees should be able to view a reservation’s detail info to contact the guest.

# Tech Requirements
- Use Node.js as the backend service
- Data should be persisted to a NoSQL database
- Build RESTful Endpoints for authentication services
- Build a GraphQL Endpoint for business services
- Unit-tests are expected
- A SPA (Single Page Application) for guests and restaurants employees 
- Scripts for building and deploying the project
- Basic Authentication



# Tech Stack
- Couchbase: for No-SQL Database
- Cucumber: for Test framework
- Docker: for Deployment
- Apollo: GraphQL framework
- TypeScript
- Mono-Repo


# Non-Tech Requirements
- Clean code & Clean Architecture
- Logging properly
- Exception handling with a good strategy






