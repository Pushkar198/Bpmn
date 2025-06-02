from flask import Flask, request, jsonify, make_response
import asyncio
import json
from flask_cors import CORS
from produce_json_logic import generate_json_from_transcript
from generate_bpmn_logic import generate_bpmn_from_json
from app3 import generate_json_main
import nest_asyncio
import asyncio
from autogen1 import main_async

nest_asyncio.apply() 
app = Flask(__name__)
@app.route('/produce_json', methods=['POST'])
def produce_json():
    data = request.json
    if not data or 'transcript' not in data:
        return jsonify({"error": "Missing 'transcript' field in JSON body"}), 400

    transcript = data['transcript']

    try:
        # Run async function in sync context
        result = asyncio.run(generate_json_main(transcript))
        return jsonify({"json": result}), 200

    except RuntimeError as re:
        return jsonify({"error": str(re)}), 500
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


@app.route('/generate_bpmn', methods=['POST'])
async def generate_bpmn():
    data = request.json
    if not data or 'product_flow' not in data:
        return jsonify({"error": "Missing 'product_flow' field in JSON body"}), 400

    product_flow_json = data['product_flow']


    try:
       result = (asyncio.run(main_async(product_flow_json)))
       if not result:
              return "Failed to generate BPMN from product flow"
       return result , 200
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True)
