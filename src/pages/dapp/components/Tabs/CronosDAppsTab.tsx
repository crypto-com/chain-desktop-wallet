import { Card, Select, Table, Tag } from 'antd';
import * as React from 'react';
import { useMemo, useState } from 'react';
import { categories, projects, CronosProject, CategoryType } from '../../assets/projects';

const columns = [
  {
    title: 'Name',
    key: 'name',
    render: (project: CronosProject, _, index) => {
      return (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '10% 20% 70%',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              color: '#626973',
            }}
          >
            {index + 1}
          </span>
          <img
            style={{
              width: '24px',
              height: '24px',
              display: 'inline',
              marginLeft: '16px',
              marginRight: '16px',
              borderRadius: '12px',
            }}
            src={`/dapp_logos/${project.logo}`}
            alt="project logo"
          />
          <span
            style={{
              color: '#1199FA',
            }}
          >
            {project.name}
          </span>
        </div>
      );
    },
  },
  {
    title: 'TVL (Total Value Locked)',
    key: 'tvl',
    render: (project: CronosProject) => {
      console.log(project);
      return 'N/A';
    },
  },
  {
    title: '1D Change',
    key: '1d_change',
    render: (project: CronosProject) => {
      console.log(project);
      return 'N/A';
    },
  },
  {
    title: '7D Change',
    key: '7d_change',
    render: (project: CronosProject) => {
      console.log(project);
      return 'N/A';
    },
  },
  {
    title: 'Category',
    key: 'category',
    render: (project: CronosProject) => (
      <div>
        {project.category.map(c => (
          <Tag color="blue" style={{ borderRadius: '4px', color: '#1199FA' }}>
            {c}
          </Tag>
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

  return (
    <Card>
      <Select
        mode="multiple"
        showSearch={false}
        style={{ minWidth: '180px' }}
        showArrow
        placeholder="Select Categories"
        onChange={e => {
          setSelectedCategories([...e]);
        }}
        value={selectedCategories}
        tagRender={props => {
          const { label, closable, onClose } = props;
          const onPreventMouseDown = event => {
            event.preventDefault();
            event.stopPropagation();
          };
          return (
            <Tag
              color="blue"
              onMouseDown={onPreventMouseDown}
              closable={closable}
              onClose={onClose}
              style={{ marginRight: 3, borderRadius: '4px', color: '#1199FA' }}
            >
              {label}
            </Tag>
          );
        }}
        options={categories.map(c => {
          return {
            label: `${c} (${categoriesNumbersMap.get(c)})`,
            value: c,
          };
        })}
      />
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
