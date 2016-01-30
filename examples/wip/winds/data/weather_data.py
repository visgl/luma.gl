import re, urllib2, json, struct, math
from BeautifulSoup import BeautifulSoup

STATE_NAME_LINE = '^([A-Z]+)\s+[0-9]{2}-[A-Z]{3}-[0-9]{2}\s*$'
STATION_LINE = """
    ^(?P<state_name>[A-Z]{2})\s+                     #state code name
     (?P<station_name>[A-Z\ ]+)\s+                   #station name
     (?P<icao>[A-Z0-9]{4})\s+                        #station ICAO
     [A-Z0-9]{3}\s*                                  #station IATA 
     [0-9]*\s*                                       #synop
     (?P<lat1>[0-9]{2})\s+(?P<lat2>[0-9]{2})N\s\s    #lat
     (?P<long1>[0-9]{3})\s+(?P<long2>[0-9]{2})W\s*   #long
     (?P<elv>[0-9]+).*$                              #elevation
"""

WIND = 'Calm|(?P<ns>S|N)?\s*(?P<we>W|E)?\s*(?P<speed>[0-9]+)|Vrbl\s+(?P<speed2>[0-9]+)'



def clear_list():
    ans = []
    re_state_name = re.compile(STATE_NAME_LINE)
    re_station = re.compile(STATION_LINE, re.VERBOSE)

    with open('weather_stations_usa.txt', 'r') as fin:
        for line in fin:
            m = re.match(re_state_name, line)
            if m:
                name = m.group(1)
            else:
                m = re.match(re_station, line)
                if m:
                    station = {
                        'name': m.group('station_name').strip(),
                        'state': name,
                        'abbr': m.group('state_name'),
                        'icao': m.group('icao'),
                        'lat': float(m.group('lat1')) + (float(m.group('lat2')) / 100.0),
                        'long': float(m.group('long1')) + (float(m.group('long2')) / 100.0),
                        'elv': float(m.group('elv'))
                    }

                    print name, station['icao']

                    try:
                        page = urllib2.urlopen('http://www.weather.gov/data/obhistory/' + station['icao'] + '.html').read()
                        with open(station['icao'] + '.html', 'w') as fout:
                            fout.write(page)
                            ans.append(station)
                    except:
                        pass

    with open('stations.json', 'w') as fjson:
        fjson.write(json.dumps(ans))


def parsefiles():
    re_wind = re.compile(WIND)
    samples = 72
    #first, get the filenames in order
    with open('stations.json', 'r') as fin:
        entries = json.loads(fin.read())

    with open('weather.bin', 'w') as fout:
        for entry in entries:
            code = entry['icao']
            
            #read html file for station
            with open(code + '.html', 'r') as fentry:
                soup = BeautifulSoup(fentry.read())

            trs = soup.findAll('tr', align='center', valign='top')
            ln = len(trs)
            counter = 0
            count = 0
            
            if ln == 0:
                step = 1
                ln = samples
                empty = True
            else:
                step = ln / float(samples)
                empty = False

            print code, counter, ln, step

            while count < samples:
                count += 1

                if empty:
                    dat = struct.pack('HHH', 0, 0, 0)
                    fout.write(dat)
                    counter += step
                    continue

                tr = trs[int(counter)]
                tds = tr.findAll('td')
                wind = tds[2].text
                temp = tds[6].text

                m = re.match(re_wind, wind)
                if m:
                    ns = m.group('ns')
                    we = m.group('we')
                    speed = m.group('speed') or m.group('speed2')

                    if not we and not ns:
                        angle = 8     #no element
                    elif not we:
                        if ns == 'N':
                            angle = 2 #math.pi / 2
                        else:
                            angle = 6 #math.pi * 3 / 2
                    elif not ns:
                        if we == 'W':
                            angle = 4 #math.pi
                        else:
                            angle = 0
                    else:
                        if   ns == 'N' and we == 'W':
                            angle = 3 #math.pi * 3 / 4
                        elif ns == 'N' and we == 'E':
                            angle = 1 #math.pi / 4
                        elif ns == 'S' and we == 'W':
                            angle = 5 #math.pi * 5 / 4
                        elif ns == 'S' and we == 'E':
                            angle = 7 #math.pi * 7 / 4

                    if speed:
                        speed = int(speed)
                    else:
                        speed = 0

                    print temp, (int(temp) + 100)

                    temp = int(temp) + 100
                    if temp < 0:
                        temp = 0

                    dat = struct.pack('HHH', angle, speed, temp)
                    fout.write(dat)

                else:
                    print "No match for ", wind
                    dat = struct.pack('HHH', 0, 0, 0)
                    fout.write(dat)

                counter += step


if __name__ == '__main__':
#    clear_list()
    parsefiles()
