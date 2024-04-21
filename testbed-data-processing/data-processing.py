import os
import glob
import shutil

# Copy files from downloads into raw_data
files = glob.glob("/home/xypp3/Downloads/dashjs_data_*.csv", recursive=False)

local_path = os.path.dirname(__file__)
dir_raw_data = os.path.join(local_path, "./raw-data")

for file in files:
    shutil.copy(file, dir_raw_data, follow_symlinks=False)

print("Data copied from downloads into raw_data")

# Process csv

# Plot
