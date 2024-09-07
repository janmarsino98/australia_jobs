import requests
import openAi

endpoint = "http://localhost:5000/job"


{
    "title": "Senior Barista",
    "description": "Looking for a barista with at least 5 years of experience",
    "remuneration_amount": 2500,
    "remuneration_period": "month",
    "firm": "Greeks bar",
    "jobtype": "waiter",
    "shift": "night",
    "location": {
        "city": "Sydney"
    }
}

r = requests.post(endpoint)