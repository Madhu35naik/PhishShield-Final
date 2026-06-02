import pandas as pd
import joblib
import shap
import os
import matplotlib.pyplot as plt

# -----------------------
# Load model + dataset
# -----------------------
BASE_DIR = os.path.dirname(__file__)
model_path = os.path.join(BASE_DIR, "phishing_model.pkl")

model = joblib.load(model_path)
data_path = os.path.join(BASE_DIR, "..", "data", "6.FinalDataset.csv")

df = pd.read_csv(data_path)

X = df.iloc[:, :-1]   # feature columns only

# -----------------------
# SHAP Explainer
# -----------------------
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X)

# -----------------------
# Summary Plot
# -----------------------
shap.summary_plot(shap_values, X, show=False)
plt.tight_layout()
plt.savefig("Images/SHAP_summary.png", dpi=300, bbox_inches="tight")
plt.close()

# -----------------------
# Bar Plot
# -----------------------
shap.summary_plot(shap_values, X, plot_type="bar", show=False)
plt.tight_layout()
plt.savefig("Images/SHAP_bar.png", dpi=300, bbox_inches="tight")
plt.close()

print("\n✔ SHAP Summary & Bar Plots Saved Successfully!")
