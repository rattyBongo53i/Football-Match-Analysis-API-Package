# python_app/main.py or flask route
@app.post("/generate-slips")
def generate_alternative_slips():
    data = request.json
    master_slip_id = data['master_slip_id']
    stake = data['stake']
    matches = data['matches']  # list of match + selected markets

    # Your magic here:
    # - Monte Carlo
    # - Coverage optimization
    # - ML predictions
    # - Generate 100+ ranked slips

    alternative_slips = generate_slips(matches, stake)

    return jsonify({
        "master_slip_id": master_slip_id,
        "total_slips": len(alternative_slips),
        "slips": alternative_slips
    })