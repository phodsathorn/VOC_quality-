"""
test_model_inference.py
-----------------------
Unit tests for Machine Learning Model Loading and Gas Classification Inference.
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from model_loader import load_model, predict, is_loaded, FEATURE_COLS, DANGEROUS_LABELS


class TestModelInference(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        load_model()

    def test_01_feature_columns_defined(self):
        """Verify standard 12-channel feature columns exist."""
        expected_features = [
            "temp", "rh", "pm25", "tvoc", "eco2",
            "mq2", "mq3", "mq135", "mq8", "mics_co", "no2", "nh3"
        ]
        self.assertEqual(FEATURE_COLS, expected_features)

    def test_02_predict_clean_air_baseline(self):
        """Test inference on baseline clean-air reading."""
        clean_air_sample = {
            "temp": 25.0,
            "rh": 55.0,
            "pm25": 12.0,
            "tvoc": 35,
            "eco2": 410,
            "mq2": 950,
            "mq3": 1100,
            "mq135": 900,
            "mq8": 1050,
            "mics_co": 1100,
            "no2": 350,
            "nh3": 650,
        }
        res = predict(clean_air_sample)
        self.assertIn("prediction", res)
        self.assertIn("confidence", res)
        self.assertIn("is_dangerous", res)
        self.assertIsInstance(res["prediction"], str)
        self.assertGreaterEqual(res["confidence"], 0.0)
        self.assertLessEqual(res["confidence"], 100.0)

    def test_03_predict_dangerous_solvent_sample(self):
        """Test inference on elevated solvent reading (high MQ-3 and TVOC)."""
        thinner_sample = {
            "temp": 30.5,
            "rh": 68.0,
            "pm25": 45.0,
            "tvoc": 1200,
            "eco2": 1500,
            "mq2": 2800,
            "mq3": 3600,
            "mq135": 2100,
            "mq8": 1800,
            "mics_co": 1900,
            "no2": 800,
            "nh3": 1400,
        }
        res = predict(thinner_sample)
        self.assertIn("prediction", res)
        self.assertIn("confidence", res)
        # If prediction is in DANGEROUS_LABELS, is_dangerous should be True
        if res["prediction"] in DANGEROUS_LABELS:
            self.assertTrue(res["is_dangerous"])

    def test_04_predict_handles_partial_missing_features(self):
        """Test that predict gracefully handles None or missing keys."""
        partial_sample = {
            "tvoc": 250,
            "mq3": 1500,
        }
        res = predict(partial_sample)
        self.assertIn("prediction", res)
        self.assertIn("confidence", res)


if __name__ == "__main__":
    unittest.main()

