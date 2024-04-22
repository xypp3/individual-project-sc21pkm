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
data_grouped_names = []

for f in glob.glob(dir_raw_data + "*", recursive=False):
    m = re.search(r"dashjs_data_(.+)_(.+)_.*\.csv", f)

    if m is None:
        # print(f"File: {f} could not match")
        continue

    rule = m.group(1)
    desc = m.group(2)
    print(rule, desc)
    try:
        data_grouped[desc][rule].append(f)
    except KeyError:
        try:
            data_grouped[desc][rule] = [f]
        except KeyError:
            data_grouped[desc] = {rule: [f]}

        print("not found", rule, desc, data_grouped)

        # check if name already exists
        found = False
        for i in range(len(data_grouped_names)):
            if desc == data_grouped_names[i][0]:
                data_grouped_names[i][1].append(rule)
                found = True

        if not found:
            data_grouped_names.append((desc, [rule]))


"""
- group files into averages
- for averages sort into different graphs

1 graph buffer health
    - compare diff bandwidths
    - compare diff rules
2 graph bitrate
    - compare diff bandwidths
    - compare diff rules
3 graph rebuffering
    - number of times rebuffering
    - average (and std) time spent on 0 buffer when rebuffering
    - NOTE: legend gives data on what rule and what bandwidth
    - NOTE: Potential for peer evaluation
4 graph sliding window size different
    - compare diff bandwidths
    - show bitrates


What do I want
- 600 rows to 600 rows
    - how do I represent the data?

Additional Data I want
- Add timer column (stopwatch from play to end of video)
- Remove fps data

"""
df_grouped_all = {}
print("New")
print(data_grouped_names)
print(data_grouped)

for desc, ruleList in data_grouped_names:
    df_grouped_all[desc] = {}
    for rule in ruleList:
        dfs = []
        for file in data_grouped[desc][rule]:
            dfs.append(pd.read_csv(file))

        # TODO: check if manual index is A. correct B. necessary
        # TODO: I don't think i want to concat, I think i wanna somehow avg/merge the data
        single_df = pd.concat(dfs, ignore_index=True)

        df_grouped_all[desc][rule] = single_df

for desc, ruleList in data_grouped_names:
    print(desc)
    for rule in ruleList:
        print(rule, df_grouped_all[desc][rule])

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
