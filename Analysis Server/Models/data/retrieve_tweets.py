import tweepy
import csv
import sys
from tqdm import tqdm

consumer_key = '88iqAiP26LftndrtIVHmI7xOn'
consumer_secret = 'auJ2tdwxevn6e9gveeUhA5mXXN3KEThNQEuJYj1BqHwtH4yN6V'
access_key = '851612638844825600-NvdRftOXWvu0XoNYn6mW4k3GWcUBD75'
access_secret = 'AnFUwz0nxyugHQzHFnTF97nett6Uy2x2TvhA2h4XK5CEG'

def get_tweets_by_account(username):
    auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
    auth.set_access_token(access_key, access_secret)
    api = tweepy.API(auth)

    number_of_tweets = 2000
    tweets_for_csv = []
    for tweet in tqdm(tweepy.Cursor(api.user_timeline, screen_name = username, include_rts=False, tweet_mode="extended", exclude_replies=True).items(number_of_tweets)):
        tweets_for_csv.append([username, tweet.id_str, tweet.created_at, tweet.full_text])
        # tweets_for_csv.append([username, tweet.id_str, tweet.created_at, tweet.text.encode("utf-8")])
    
    out_file = username + "_tweets_2.csv"
    with open(out_file, "w+") as file:
        writer = csv.writer(file, delimiter = ',')
        writer.writerows(tweets_for_csv)

def main():
    username = 'USGSVolcanoes'
    get_tweets_by_account(username)
    print("Finished")

if __name__ == "__main__":
    main()