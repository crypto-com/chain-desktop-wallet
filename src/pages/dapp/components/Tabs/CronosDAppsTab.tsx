import { Button, Card, Checkbox, Dropdown, Menu, Table, Tag } from 'antd';
import * as React from 'react';
import { useMemo, useState } from 'react';
import { categories, projects, CronosProject, CategoryType } from '../../assets/projects';

const columns = [
  {
    title: 'Name',
    key: 'name',
    render: (project: CronosProject) => <div>{project.name}</div>,
  },

  {
    title: 'Category',
    key: 'category',
    render: (project: CronosProject) => (
      <div>
        {project.category.map(c => (
          <Tag>{c}</Tag>
        ))}
      </div>
    ),
  },
];

const CronosDAppsTab = () => {
  const [selectedCategories, setSelectedCategories] = useState<CategoryType[]>([]);

  const categoriesNumbersMap = useMemo(() => {
    const map = new Map<CategoryType, number>();
    projects.forEach(p => {
      p.category.forEach(c => {
        const count = map.get(c) || 0;
        map.set(c, count + 1);
      });
    });
    return map;
  }, [projects]);

  // dropdown categories
  const dropdown = () => (
    <Menu>
      {categories
        .filter(cat => {
          return categoriesNumbersMap.get(cat);
        })
        .map((data, idx) => (
          <Menu.Item /* className={styles.label} */ key={idx}>
            <Checkbox
              key={data}
              value={data}
              onChange={e => {
                if (e.target.checked) {
                  setSelectedCategories([...selectedCategories, data]);
                } else {
                  setSelectedCategories([...selectedCategories.filter(c => c !== data)]);
                }
              }}
            >
              {data} ({categoriesNumbersMap.get(data)})
            </Checkbox>
          </Menu.Item>
        ))}
    </Menu>
  );

  return (
    <Card>
      <Dropdown
        // overlayClassName={styles.navDropdown}
        placement="bottomCenter"
        overlay={dropdown}
        // visible={visible}
        // onVisibleChange={handleVisibleChange}
      >
        <Button
          className="ant-dropdown-link"
          // onChange={filterChange}
          onClick={e => e.preventDefault()}
        >
          {/* <span className={styles.inputFilter}>
            By Category
            <img alt="arrow" src={arrow} className={styles.search} />
          </span> */}
          hi
        </Button>
      </Dropdown>
      <Table
        dataSource={
          selectedCategories.length === 0
            ? projects
            : projects.filter(project => {
                return project.category.some(c => selectedCategories.includes(c));
              })
        }
        columns={columns}
      />
    </Card>
  );
};

export default CronosDAppsTab;
