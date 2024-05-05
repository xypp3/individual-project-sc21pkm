# import os
# import glob
# import shutil
# import re
# import pandas as pd
# import matplotlib.pyplot as plt
#
# # Copy files from downloads into raw_data
# files = glob.glob("/home/xypp3/Downloads/dashjs_data_*.csv", recursive=False)
#
# local_path = os.path.dirname(__file__)
# dir_raw_data = os.path.join(local_path, "./raw-data/")
#
# for file in files:
#     shutil.copy(file, dir_raw_data, follow_symlinks=False)
#
# print("Data copied from downloads into raw_data")
#
# # group raw data files together
# data_grouped = {}
# data_grouped_names = []
#
# for f in glob.glob(dir_raw_data + "*", recursive=False):
#     m = re.search(r"dashjs_data_(.+)_(.+)_.*\.csv", f)
#
#     if m is None:
#         # print(f"File: {f} could not match")
#         continue
#
#     rule = m.group(1)
#     desc = m.group(2)
#     print(rule, desc)
#     try:
#         data_grouped[desc][rule].append(f)
#     except KeyError:
#         try:
#             data_grouped[desc][rule] = [f]
#         except KeyError:
#             data_grouped[desc] = {rule: [f]}
#
#         print("not found", rule, desc, data_grouped)
#
#         # check if name already exists
#         found = False
#         for i in range(len(data_grouped_names)):
#             if desc == data_grouped_names[i][0]:
#                 data_grouped_names[i][1].append(rule)
#                 found = True
#
#         if not found:
#             data_grouped_names.append((desc, [rule]))
#
#
# """
# - group files into averages
# - for averages sort into different graphs
#
# 1 graph buffer health
#     - compare diff bandwidths
#     - compare diff rules
# 2 graph bitrate
#     - compare diff bandwidths
#     - compare diff rules
# 3 graph rebuffering
#     - number of times rebuffering
#     - average (and std) time spent on 0 buffer when rebuffering
#     - NOTE: legend gives data on what rule and what bandwidth
#     - NOTE: Potential for peer evaluation
# 4 graph sliding window size different
#     - compare diff bandwidths
#     - show bitrates
#
#
# What do I want
# - 600 rows to 600 rows
#     - how do I represent the data?
#
# Additional Data I want
# - Add timer column (stopwatch from play to end of video)
# - Remove fps data
#
# """
# df_grouped_all = {}
# print("New")
# print(data_grouped_names)
# print(data_grouped)
#
# for desc, ruleList in data_grouped_names:
#     df_grouped_all[desc] = {}
#     for rule in ruleList:
#         dfs = []
#         for file in data_grouped[desc][rule]:
#             dfs.append(pd.read_csv(file))
#
#         # TODO: check if manual index is A. correct B. necessary
#         # TODO: I don't think i want to concat, I think i wanna somehow avg/merge the data
#         single_df = pd.concat(dfs, ignore_index=True)
#
#         df_grouped_all[desc][rule] = single_df
#
# for desc, ruleList in data_grouped_names:
#     print(desc)
#     for rule in ruleList:
#         print(rule, df_grouped_all[desc][rule])

import pandas as pd  # https://www.youtube.com/watch?v=E5ONTXHS2mM
import matplotlib.pyplot as plt

# .csv column names
col_index = "Index"
col_buffer = " Buffer Level"
col_bitrate = " Bitrate"
col_playback = " Playback Timestamp"
col_qoe = " QoE"
col_resolution = " Resolution"


def plot_graph(
    csv_file1,
    csv_file2,
    file1_label,
    file2_label,
    x_col,
    y_col,
    title,
    x_label="",
    y_label="",
):
    if x_label == "":
        x_label = x_col
    if y_label == "":
        y_label = y_col

    # Read the CSV files into pandas DataFrames
    df1 = pd.read_csv(csv_file1)
    df2 = pd.read_csv(csv_file2)

    print(df1)
    print("Columns in File 1:", df1.columns)
    print("Columns in File 2:", df2.columns)

    # Plotting
    plt.figure(figsize=(10, 6))
    plt.plot(df1[x_col], df1[y_col], label=file1_label)
    plt.plot(df2[x_col], df2[y_col], label=file2_label)

    # Add labels and title
    plt.xlabel(x_label)
    plt.ylabel(y_label)
    plt.title(title)

    # Add legend
    plt.legend()

    # Show plot
    plt.grid(True)
    plt.show()


# Example usage:
file1 = "./raw-data/dashjs_data_newRule_default-desc_.csv"
file2 = "./raw-data/dashjs_data_BBARule_default-desc_.csv"
plot_graph(
    file1, file2, "newRule", "BBARule", col_bitrate, col_buffer, "Playback vs Bitrate"
)
