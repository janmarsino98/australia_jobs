from flask import Flask,Blueprint, jsonify, request, session
from extensions import mongo, bcrypt  # Import from extensions
from flask_pymongo import ObjectId
from datetime import datetime
import constants as c
import stripe

stripe.api_key = 'sk_test_51Q83DKRvr2lf43Pu7rxqSkBy9NfqFLffJ18wSKJphsL6fozICNjJ4sIR5pXsDfnfg4bIxqSyF7301eGMPjiuP97Z006wtOJpCl'

cities_bp = Blueprint("cities_bp", __name__)
cities_db = mongo.db.cities

@cities_bp.route("/", methods=["GET"])
def get_cities():
    """Root route for /cities - returns all cities"""
    cities = cities_db.find({})
    final_cities = []
    for city in cities:
        city["_id"] = str(city["_id"])
        final_cities.append(city)
    return jsonify(final_cities)

@cities_bp.route("/add_all", methods=["POST"])
def add_all_cities():
    data = request.get_json()
    for city in data:
        cities_db.insert_one({"city":city["city"], "state": city["admin_name"]})
        
    return jsonify({"message": "Cities added correctly!"}), 200

@cities_bp.route("/get_all", methods=["GET"])
def get_all_cities():
    cities = cities_db.find({})
    final_cities = []
    for city in cities:
        city["_id"] = str(city["_id"])
        final_cities.append(city)
    return jsonify(final_cities)

@cities_bp.route("/get_main", methods=["GET"])
def get_main_cities():
    cities = ["Sydney", "Melbourne", "Brisbane", "Canberra"]
    result = cities_db.find({"city": {"$in": cities}})
    final_result = []
    for city in result:
        city["_id"] = str(city["_id"])
        final_result.append(city)
        
    return jsonify(final_result)

@cities_bp.route('/create-payment-intent', methods=['POST'])
def create_payment_intent():
    try:
        data = request.get_json()
        price = data.get('price')
        intent = stripe.PaymentIntent.create(
            amount=int(price * 100),
            currency='usd',
            automatic_payment_methods={'enabled': True},
        )
        return {
            'clientSecret': intent['client_secret']
        }
    except Exception as e:
        return {'error': str(e)}, 400
