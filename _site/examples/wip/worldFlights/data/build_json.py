import json

def airlines():
  ans = []
  with open('airlines.csv', 'r') as fin:
    text = fin.read().split('\n')
    for i, line in enumerate(text):
      if i > 0:
        ans.append(line.replace('"', '').split(','))
  
  with open('airlines.json', 'w') as fout:
    fout.write(json.dumps(ans, encoding='latin-1'))

def cities():
  ans = {}
  with open('cities.csv', 'r') as fin:
    text = fin.read().split('\n')
    for i, line in enumerate(text):
      if i > 0:
        split_line = line.replace('"', '').split(',')
        try:
          ans[split_line[0].lower() + '^' + split_line[1].lower() + '^' + split_line[2].lower()] = split_line
        except:
          pass
  
  with open('cities.json', 'w') as fout:
    fout.write(json.dumps(ans, encoding='latin-1'))

def routes():
  places = {}
  airlines = {}
  with open('routes.csv', 'r') as fin:
    text = fin.read().split('\n')
    for i, line in enumerate(text):
      if i > 0:
        try:
          #populate airline
          split_line = line.replace('"', '').split(',')
          airline_routes = airlines.get(split_line[0], [])
          airline_routes.append([n.lower() for n in split_line[1:]])
          airlines[split_line[0]] = airline_routes
          #populate places
          source_city, source_country = split_line[2].lower(), split_line[3].lower()
          key = source_city + '^' + source_country
          place_routes = places.get(key, [])
          place_routes.append([n.lower() for n in split_line])
          places[key] = place_routes
    
          destination_city, destination_country = split_line[4].lower(), split_line[5].lower()
          key = destination_city + '^' + destination_country
          place_routes = places.get(key, [])
          place_routes.append([n.lower() for n in split_line])
          places[key] = place_routes
        except:
          pass
  
  for k, v in airlines.iteritems():
    with open('airlines/' + k + '.json', 'w') as fout:
      fout.write(json.dumps(v, encoding='latin-1'))
  
  for k, v in places.iteritems():
    with open('places/' + k.replace('/', '-').replace(' ', '_') + '.json', 'w') as fout:
      fout.write(json.dumps(v, encoding='latin-1'))

if __name__ == '__main__':
  airlines()
  cities()
  routes()

