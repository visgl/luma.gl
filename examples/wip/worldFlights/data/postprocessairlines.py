def cities(): 
    ans = []
    with open('airports.dat', 'r') as f_in:
        with open('cities.csv', 'w') as f_out:
            for line in f_in:
                fields = line.split(',')
                print fields
                ans.append(','.join([fields[1], fields[2], fields[3], fields[-5], fields[-4]]))

            f_out.write('\n'.join(ans))

def airlines():
  ans = []
  with open('airlines.csv', 'r') as f_airline_csv:
      with open('airlines.dat', 'r') as f_airline_dat:
          with open('country.iso.csv', 'r') as f_country_iso:
              with open('country.lat.csv', 'r') as f_country_lat:
                  with open('airlines2.csv', 'w') as f_out:

                    text_airline_csv = f_airline_csv.read().split('\n')
                    text_airline_dat = f_airline_dat.read().split('\n')
                    text_country_iso = f_country_iso.read().split('\n')
                    text_country_lat = f_country_lat.read().split('\n')

                    for idx, line in enumerate(text_airline_csv):
                        fields = line.split(',')
                        value = int(fields[0])
                        index = get_by_field(0, value, text_airline_dat)
                        print idx, value, text_airline_dat[index]
                        country_name = text_airline_dat[index].split(',')[-2].split('"')[1]
                        code = get_country_code(country_name, text_country_iso)
                        lat, lon = get_country_lat_lon(code, text_country_lat)
                        fields.append(lat)
                        fields.append(lon)
                        f_out.write(','.join(fields) + '\n')

                        if idx == 192:
                            return


def get_by_field(field_index, field_value, mylist):

    def bin_search(mylist, begin, end):
        while begin < end:
            mid = (begin + end) / 2
            value = int(mylist[mid].split(',')[field_index])

            if value < field_value:
                begin = mid + 1
            elif value > field_value:
                end = mid
            else:
                return mid

        return end - begin

    return bin_search(mylist, 0, len(mylist))

def get_country_code(country_name, text_country_iso):
    for line in text_country_iso:
        fields = line.split(',')
        name = fields[-1].split('"')[1]
        if name.lower() == country_name.lower():
            return fields[0]
    
    return False

def get_country_lat_lon(country_code, text_country_lat):
    for line in text_country_lat:
        fields = line.split(',')
        code = fields[0]
        if code == country_code:
            return fields[1], fields[2]
    
    return False, False

if __name__ == '__main__':
  # airlines()
    cities()
