import os
import glob
import shutil
import re
import pandas as pd
import matplotlib.pyplot as plt

# Copy files from downloads into raw_data
files = glob.glob("/home/xypp3/Downloads/dashjs_data_*.csv", recursive=False)

local_path = os.path.dirname(__file__)
dir_raw_data = os.path.join(local_path, "./raw-data/")

for file in files:
    shutil.copy(file, dir_raw_data, follow_symlinks=False)

print("Data copied from downloads into raw_data")

# group raw data files together
data_grouped = {}
data_group_names = []
for f in glob.glob(dir_raw_data + "*", recursive=False):
    m = re.search(r"dashjs_data_(.+)_(.+)_.*\.csv", f)

    if m is None:
        print(f"File: {f} could not match")
        continue

    rule = m.group(1)
    desc = m.group(2)
    print(rule, desc)
    try:
        data_grouped[desc][rule].append(f)
    except:
        data_grouped[desc] = {rule: [f]}
        for i in range(len(data_group_names)):
            if desc == data_group_names[i][0]:
                data_group_names[i][1].append(rule)

        data_group_names.append((desc, [rule]))

print(data_grouped, data_group_names)
#
# # Read the CSV file into a DataFrame
# df = pd.read_csv(dir_raw_data + "dashjs_data_RandomBitrateRule_default-desc(4).csv")
#
# # Drop resolution column
# df = df[df.columns[:-1]]
# # Calculate the average and standard deviation
# average = df.mean()
# std_dev = df.std()
#
# print(average, std_dev)
# # Plotting
# plt.figure(figsize=(10, 6))
#
# # Plotting average
# plt.plot(average.index, average.values, label="Average")
#
# # Plotting standard deviation as error bars
# plt.errorbar(
#     average.index,
#     average.values,
#     yerr=std_dev.values,
#     fmt="o",
#     label="Standard Deviation",
# )
#
# # Adding labels and title
# plt.xlabel("X-axis label")
# plt.ylabel("Y-axis label")
# plt.title("Average and Standard Deviation")
# plt.legend()
#
# # Show plot
# plt.show()
