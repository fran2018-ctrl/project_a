from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
import yfinance as yf

app = Flask(__name__)
CORS(app)

VALID_PERIODS = {"1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/stock")
def get_stock():
    symbol = request.args.get("symbol", "").strip().upper()
    period = request.args.get("period", "1y")

    if not symbol:
        return jsonify({"error": "Stock symbol is required."}), 400

    if period not in VALID_PERIODS:
        return jsonify({"error": f"Invalid period '{period}'."}), 400

    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period)

        if hist.empty:
            return jsonify({"error": f"No data found for symbol '{symbol}'. Check that it is a valid ticker."}), 404

        info = ticker.fast_info
        currency = getattr(info, "currency", "USD") or "USD"

        labels = [str(ts.date()) if period != "1d" else ts.strftime("%H:%M") for ts in hist.index]

        return jsonify({
            "symbol": symbol,
            "currency": currency,
            "labels": labels,
            "close": [round(float(v), 4) for v in hist["Close"]],
            "volume": [int(v) for v in hist["Volume"]],
        })

    except Exception as e:
        return jsonify({"error": f"Failed to fetch data: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=False, port=5001)
